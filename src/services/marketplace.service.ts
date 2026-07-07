import { supabaseAdmin } from '../config/supabase';
import type { AuthUser } from '../types/auth';
import { toSnakeCaseObject } from '../utils/case';
import { AppError, notFound } from '../utils/errors';
import { getPagination } from '../utils/pagination';

type RecordPayload = Record<string, unknown>;

interface PublicJobSearch {
  page?: number;
  limit?: number;
  q?: string;
  location?: string;
  remoteType?: string;
  employmentType?: string;
  seniority?: string;
  minSalary?: number;
  skill?: string;
}

interface RecruiterJobSearch {
  page?: number;
  limit?: number;
  companyId?: string;
  status?: string;
}

export class MarketplaceService {
  static async listOpenJobs(filters: PublicJobSearch) {
    const { page, limit, from, to } = getPagination(filters);
    let query = supabaseAdmin
      .from('jobs')
      .select('*, companies(id, name, website, industry)', { count: 'exact' })
      .eq('status', 'open')
      .range(from, to)
      .order('created_at', { ascending: false });

    if (filters.q) query = query.or(`title.ilike.%${filters.q}%,description.ilike.%${filters.q}%`);
    if (filters.location) query = query.ilike('location', `%${filters.location}%`);
    if (filters.remoteType) query = query.eq('remote_type', filters.remoteType);
    if (filters.employmentType) query = query.eq('employment_type', filters.employmentType);
    if (filters.seniority) query = query.eq('seniority', filters.seniority);
    if (filters.minSalary !== undefined) query = query.gte('max_salary', filters.minSalary);
    if (filters.skill) query = query.contains('required_skills', [filters.skill]);

    const { data, error, count } = await query;
    if (error) throw new AppError(500, 'INTERNAL_ERROR', 'Failed to list open jobs', error.message);

    return { rows: data ?? [], pagination: { page, limit, total: count ?? 0 } };
  }

  static async getOpenJob(jobId: string) {
    const { data, error } = await supabaseAdmin
      .from('jobs')
      .select('*, companies(id, name, website, industry, description)')
      .eq('id', jobId)
      .eq('status', 'open')
      .maybeSingle();

    if (error) throw new AppError(500, 'INTERNAL_ERROR', 'Failed to fetch job', error.message);
    if (!data) throw notFound('job');
    return data;
  }

  static async listRecruiterJobs(user: AuthUser, filters: RecruiterJobSearch) {
    const companyIds = this.scopedCompanyIds(user, filters.companyId);
    const { page, limit, from, to } = getPagination(filters);
    let query = supabaseAdmin
      .from('jobs')
      .select('*, companies(id, name)', { count: 'exact' })
      .in('company_id', companyIds)
      .range(from, to)
      .order('created_at', { ascending: false });

    if (filters.status) query = query.eq('status', filters.status);

    const { data, error, count } = await query;
    if (error) throw new AppError(500, 'INTERNAL_ERROR', 'Failed to list recruiter jobs', error.message);

    const rows = await this.attachApplicantCounts(data ?? []);
    return { rows, pagination: { page, limit, total: count ?? 0 } };
  }

  static async createRecruiterJob(user: AuthUser, payload: RecordPayload) {
    const companyId = payload.companyId as string | undefined;
    if (!companyId) throw new AppError(400, 'VALIDATION_ERROR', 'companyId is required');
    this.assertCompanyAccess(user, companyId);

    const { data, error } = await supabaseAdmin
      .from('jobs')
      .insert(toSnakeCaseObject(payload))
      .select('*')
      .single();

    if (error) throw new AppError(400, 'VALIDATION_ERROR', 'Failed to create job', error.message);
    return data;
  }

  static async updateRecruiterJob(user: AuthUser, jobId: string, payload: RecordPayload) {
    const job = await this.requireRecruiterJob(user, jobId);

    const { data, error } = await supabaseAdmin
      .from('jobs')
      .update({ ...toSnakeCaseObject(payload), updated_at: new Date().toISOString() })
      .eq('id', job.id)
      .select('*')
      .single();

    if (error) throw new AppError(400, 'VALIDATION_ERROR', 'Failed to update job', error.message);
    return data;
  }

  static async setRecruiterJobStatus(user: AuthUser, jobId: string, status: 'draft' | 'open' | 'paused' | 'closed') {
    await this.requireRecruiterJob(user, jobId);
    const statusPatch = status === 'open' ? { status, published_at: new Date().toISOString() } : { status };

    const { data, error } = await supabaseAdmin
      .from('jobs')
      .update({ ...statusPatch, updated_at: new Date().toISOString() })
      .eq('id', jobId)
      .select('*')
      .single();

    if (error) throw new AppError(400, 'VALIDATION_ERROR', 'Failed to update job status', error.message);
    return data;
  }

  static async deleteRecruiterJob(user: AuthUser, jobId: string) {
    await this.requireRecruiterJob(user, jobId);
    const { error } = await supabaseAdmin.from('jobs').delete().eq('id', jobId);
    if (error) throw new AppError(400, 'VALIDATION_ERROR', 'Failed to delete job', error.message);
    return { id: jobId };
  }

  static async listJobApplicants(user: AuthUser, jobId: string) {
    await this.requireRecruiterJob(user, jobId);

    const { data, error } = await supabaseAdmin
      .from('applications')
      .select('*, users(id, email, full_name), resumes(id, title, structured_data)')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false });

    if (error) throw new AppError(500, 'INTERNAL_ERROR', 'Failed to list applicants', error.message);

    const applications = data ?? [];
    const candidateIds = applications
      .map((application) => application.candidate_id)
      .filter((candidateId): candidateId is string => typeof candidateId === 'string');
    const candidateIdsMissingResume = applications
      .filter((application) => !application.resumes && typeof application.candidate_id === 'string')
      .map((application) => application.candidate_id as string);

    const { data: fallbackResumes, error: fallbackResumeError } = candidateIdsMissingResume.length
      ? await supabaseAdmin
          .from('resumes')
          .select('id, candidate_id, title, structured_data')
          .in('candidate_id', candidateIdsMissingResume)
          .eq('is_primary', true)
      : { data: [], error: null };

    if (fallbackResumeError) throw new AppError(500, 'INTERNAL_ERROR', 'Failed to load primary resumes for applicants', fallbackResumeError.message);

    const primaryResumeByCandidate = new Map<string, Record<string, unknown>>();
    for (const resume of fallbackResumes ?? []) {
      const candidateId = resume.candidate_id as string | undefined;
      if (candidateId && !primaryResumeByCandidate.has(candidateId)) primaryResumeByCandidate.set(candidateId, resume);
    }

    const { data: scoreRows, error: scoreError } = candidateIds.length
      ? await supabaseAdmin
          .from('candidate_job_scores')
          .select('*')
          .eq('job_id', jobId)
          .in('candidate_id', candidateIds)
          .order('created_at', { ascending: false })
      : { data: [], error: null };

    if (scoreError) throw new AppError(500, 'INTERNAL_ERROR', 'Failed to list candidate scores', scoreError.message);

    const latestScoreByCandidate = new Map<string, Record<string, unknown>>();
    for (const score of scoreRows ?? []) {
      const candidateId = score.candidate_id as string | undefined;
      if (candidateId && !latestScoreByCandidate.has(candidateId)) latestScoreByCandidate.set(candidateId, score);
    }

    return applications.map((application) => {
      const fallbackResume = primaryResumeByCandidate.get(application.candidate_id as string);
      const enrichedApplication = fallbackResume && !application.resumes
        ? { ...application, resume_id: application.resume_id ?? fallbackResume.id, resumes: fallbackResume }
        : application;
      return this.normalizeApplicant(enrichedApplication, latestScoreByCandidate.get(application.candidate_id as string));
    });
  }

  static async updateApplicationStatus(user: AuthUser, applicationId: string, payload: RecordPayload) {
    const application = await this.requireRecruiterApplication(user, applicationId);

    const { data, error } = await supabaseAdmin
      .from('applications')
      .update({ ...toSnakeCaseObject(payload), updated_at: new Date().toISOString() })
      .eq('id', application.id)
      .select('*')
      .single();

    if (error) throw new AppError(400, 'VALIDATION_ERROR', 'Failed to update application', error.message);
    return data;
  }

  static async getCandidateProfile(user: AuthUser) {
    const { data, error } = await supabaseAdmin
      .from('candidate_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) throw new AppError(500, 'INTERNAL_ERROR', 'Failed to fetch candidate profile', error.message);
    return data;
  }

  static async updateCandidateProfile(user: AuthUser, payload: RecordPayload) {
    const { data, error } = await supabaseAdmin
      .from('candidate_profiles')
      .update({ ...toSnakeCaseObject(payload), updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .select('*')
      .single();

    if (error) throw new AppError(400, 'VALIDATION_ERROR', 'Failed to update candidate profile', error.message);
    return data;
  }

  static async applyToJob(user: AuthUser, jobId: string, payload: RecordPayload) {
    await this.getOpenJob(jobId);

    const { data, error } = await supabaseAdmin
      .from('applications')
      .insert({
        job_id: jobId,
        candidate_id: user.id,
        resume_id: payload.resumeId,
        cover_letter: payload.coverLetter,
        source: payload.source ?? 'hireos',
        status: 'applied'
      })
      .select('*')
      .single();

    if (error) throw new AppError(409, 'CONFLICT', 'Failed to apply to job', error.message);
    return data;
  }

  static async listCandidateApplications(user: AuthUser) {
    const { data, error } = await supabaseAdmin
      .from('applications')
      .select('*, jobs(*, companies(id, name))')
      .eq('candidate_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw new AppError(500, 'INTERNAL_ERROR', 'Failed to list applications', error.message);
    return data ?? [];
  }

  static async updateCandidateApplication(user: AuthUser, applicationId: string, payload: RecordPayload) {
    const { data, error } = await supabaseAdmin
      .from('applications')
      .update({ ...toSnakeCaseObject(payload), updated_at: new Date().toISOString() })
      .eq('id', applicationId)
      .eq('candidate_id', user.id)
      .select('*')
      .maybeSingle();

    if (error) throw new AppError(400, 'VALIDATION_ERROR', 'Failed to update application', error.message);
    if (!data) throw notFound('application');
    return data;
  }

  static async withdrawCandidateApplication(user: AuthUser, applicationId: string) {
    const { data, error } = await supabaseAdmin
      .from('applications')
      .update({ status: 'withdrawn', updated_at: new Date().toISOString() })
      .eq('id', applicationId)
      .eq('candidate_id', user.id)
      .select('*')
      .maybeSingle();

    if (error) throw new AppError(400, 'VALIDATION_ERROR', 'Failed to withdraw application', error.message);
    if (!data) throw notFound('application');
    return data;
  }

  static async listCandidateResumes(user: AuthUser) {
    const { data, error } = await supabaseAdmin
      .from('resumes')
      .select('*, documents(id, file_name, mime_type, storage_path), resume_scores(*)')
      .eq('candidate_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw new AppError(500, 'INTERNAL_ERROR', 'Failed to list resumes', error.message);
    return (data ?? []).map((resume) => this.sortResumeScores(resume));
  }

  static async createCandidateResume(user: AuthUser, payload: RecordPayload) {
    const { data, error } = await supabaseAdmin
      .from('resumes')
      .insert(toSnakeCaseObject({ ...payload, candidateId: user.id }))
      .select('*')
      .single();

    if (error) throw new AppError(400, 'VALIDATION_ERROR', 'Failed to create resume', error.message);

    if (payload.isPrimary === true) {
      await this.setPrimaryResume(user, data.id as string);
      return this.getCandidateResume(user, data.id as string);
    }

    return data;
  }

  static async getCandidateResume(user: AuthUser, resumeId: string) {
    const { data, error } = await supabaseAdmin
      .from('resumes')
      .select('*, documents(id, file_name, mime_type, storage_path), resume_scores(*)')
      .eq('id', resumeId)
      .eq('candidate_id', user.id)
      .maybeSingle();

    if (error) throw new AppError(500, 'INTERNAL_ERROR', 'Failed to fetch resume', error.message);
    if (!data) throw notFound('resume');
    return this.sortResumeScores(data);
  }

  static async updateCandidateResume(user: AuthUser, resumeId: string, payload: RecordPayload) {
    await this.getCandidateResume(user, resumeId);

    const { data, error } = await supabaseAdmin
      .from('resumes')
      .update({ ...toSnakeCaseObject(payload), updated_at: new Date().toISOString() })
      .eq('id', resumeId)
      .eq('candidate_id', user.id)
      .select('*')
      .single();

    if (error) throw new AppError(400, 'VALIDATION_ERROR', 'Failed to update resume', error.message);

    if (payload.isPrimary === true) {
      await this.setPrimaryResume(user, resumeId);
      return this.getCandidateResume(user, resumeId);
    }

    return data;
  }

  static async deleteCandidateResume(user: AuthUser, resumeId: string) {
    const resume = await this.getCandidateResume(user, resumeId);
    if (resume.is_primary) {
      throw new AppError(409, 'CONFLICT', 'Cannot delete the primary resume until another resume is marked primary');
    }

    const { error } = await supabaseAdmin.from('resumes').delete().eq('id', resumeId).eq('candidate_id', user.id);
    if (error) throw new AppError(400, 'VALIDATION_ERROR', 'Failed to delete resume', error.message);
    return { id: resumeId };
  }

  static async setPrimaryResume(user: AuthUser, resumeId: string) {
    await this.getCandidateResume(user, resumeId);

    const { error: clearError } = await supabaseAdmin
      .from('resumes')
      .update({ is_primary: false, updated_at: new Date().toISOString() })
      .eq('candidate_id', user.id);

    if (clearError) throw new AppError(400, 'VALIDATION_ERROR', 'Failed to clear primary resume', clearError.message);

    const { data, error } = await supabaseAdmin
      .from('resumes')
      .update({ is_primary: true, updated_at: new Date().toISOString() })
      .eq('id', resumeId)
      .eq('candidate_id', user.id)
      .select('*')
      .single();

    if (error) throw new AppError(400, 'VALIDATION_ERROR', 'Failed to set primary resume', error.message);
    return data;
  }

  static async saveJob(user: AuthUser, jobId: string) {
    await this.getOpenJob(jobId);

    const { data, error } = await supabaseAdmin
      .from('saved_jobs')
      .insert({ candidate_id: user.id, job_id: jobId })
      .select('*')
      .single();

    if (error) throw new AppError(409, 'CONFLICT', 'Failed to save job', error.message);
    return data;
  }

  static async listSavedJobs(user: AuthUser) {
    const { data, error } = await supabaseAdmin
      .from('saved_jobs')
      .select('*, jobs(*, companies(id, name))')
      .eq('candidate_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw new AppError(500, 'INTERNAL_ERROR', 'Failed to list saved jobs', error.message);
    return data ?? [];
  }

  static async unsaveJob(user: AuthUser, jobId: string) {
    const { error } = await supabaseAdmin.from('saved_jobs').delete().eq('candidate_id', user.id).eq('job_id', jobId);
    if (error) throw new AppError(400, 'VALIDATION_ERROR', 'Failed to unsave job', error.message);
    return { jobId };
  }

  private static async attachApplicantCounts<T extends Record<string, unknown>>(jobs: T[]) {
    const jobIds = jobs.map((job) => job.id).filter((id): id is string => typeof id === 'string');
    if (!jobIds.length) return jobs;

    const { data, error } = await supabaseAdmin
      .from('applications')
      .select('job_id')
      .in('job_id', jobIds);

    if (error) throw new AppError(500, 'INTERNAL_ERROR', 'Failed to count applicants', error.message);

    const counts = new Map<string, number>();
    for (const application of data ?? []) {
      const jobId = application.job_id as string | undefined;
      if (jobId) counts.set(jobId, (counts.get(jobId) ?? 0) + 1);
    }

    return jobs.map((job) => ({ ...job, applicantCount: counts.get(job.id as string) ?? 0 }));
  }

  private static normalizeApplicant(application: Record<string, unknown>, scoreRow?: Record<string, unknown>) {
    const user = this.asRecord(application.users);
    const resume = this.asRecord(application.resumes);
    const structured = this.asRecord(resume.structured_data);
    const contact = this.asRecord(structured.contact);
    const experience = Array.isArray(structured.experience) ? structured.experience : [];
    const firstExperience = this.asRecord(experience[0]);
    const skills = Array.isArray(structured.skills)
      ? structured.skills.filter((skill): skill is string => typeof skill === 'string')
      : [];

    return {
      id: application.id,
      jobId: application.job_id,
      candidateId: application.candidate_id,
      resumeId: application.resume_id,
      status: application.status,
      source: application.source,
      recruiterNotes: application.recruiter_notes,
      createdAt: application.created_at,
      updatedAt: application.updated_at,
      candidate: {
        id: user.id ?? application.candidate_id,
        fullName: user.full_name ?? contact.full_name ?? 'Candidate',
        email: user.email ?? contact.email,
        headline: firstExperience.title ?? firstExperience.role ?? firstExperience.position ?? structured.summary,
        skills
      },
      resume: {
        id: resume.id,
        title: resume.title,
        structuredData: structured
      },
      aiScore: this.normalizeCandidateScore(scoreRow)
    };
  }

  private static normalizeCandidateScore(scoreRow?: Record<string, unknown>) {
    if (!scoreRow) return null;
    const result = this.asRecord(scoreRow.result);
    const matched = scoreRow.matched_requirements ?? result.matchedRequirements ?? result.matched_requirements;
    const missing = scoreRow.missing_requirements ?? result.missingRequirements ?? result.missing_requirements;
    const concerns = result.concerns;
    const focus = result.interviewFocus ?? result.interview_focus;
    return {
      score: typeof scoreRow.score === 'number' ? scoreRow.score : this.numberFrom(result.score),
      confidence: typeof scoreRow.confidence === 'number' ? scoreRow.confidence : this.numberFrom(result.confidence),
      matchedRequirements: Array.isArray(matched) ? matched : [],
      missingRequirements: Array.isArray(missing) ? missing : [],
      evidence: this.asRecord(scoreRow.evidence ?? result.evidence),
      concerns: Array.isArray(concerns) ? concerns : [],
      interviewFocus: Array.isArray(focus) ? focus : [],
      warnings: Array.isArray(scoreRow.warnings) ? scoreRow.warnings : [],
      result
    };
  }

  static async getRecruiterProfile(user: AuthUser) {
    const { data, error } = await supabaseAdmin
      .from('recruiter_profiles')
      .select('*, companies(*)')
      .eq('user_id', user.id)
      .single();

    if (error) throw new AppError(500, 'INTERNAL_ERROR', 'Failed to fetch recruiter profile', error.message);
    return data;
  }

  static async updateRecruiterProfile(user: AuthUser, payload: RecordPayload) {
    const { data, error } = await supabaseAdmin
      .from('recruiter_profiles')
      .update({ ...toSnakeCaseObject(payload), updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .select('*')
      .single();

    if (error) throw new AppError(400, 'VALIDATION_ERROR', 'Failed to update recruiter profile', error.message);
    return data;
  }

  static async listRecruiterCompanies(user: AuthUser) {
    const { data, error } = await supabaseAdmin
      .from('company_members')
      .select('*, companies(*)')
      .eq('user_id', user.id);

    if (error) throw new AppError(500, 'INTERNAL_ERROR', 'Failed to list recruiter companies', error.message);
    return data ?? [];
  }

  static async updateRecruiterCompany(user: AuthUser, companyId: string, payload: RecordPayload) {
    this.assertCompanyAccess(user, companyId);

    const { data, error } = await supabaseAdmin
      .from('companies')
      .update({ ...toSnakeCaseObject(payload), updated_at: new Date().toISOString() })
      .eq('id', companyId)
      .select('*')
      .single();

    if (error) throw new AppError(400, 'VALIDATION_ERROR', 'Failed to update company', error.message);
    return data;
  }

  private static scopedCompanyIds(user: AuthUser, requestedCompanyId?: string) {
    if (user.role === 'admin') {
      if (requestedCompanyId) return [requestedCompanyId];
      throw new AppError(400, 'VALIDATION_ERROR', 'Admin requests must include companyId for scoped recruiter views');
    }

    if (requestedCompanyId) {
      this.assertCompanyAccess(user, requestedCompanyId);
      return [requestedCompanyId];
    }

    if (!user.companyIds.length) {
      throw new AppError(403, 'AUTHORIZATION_ERROR', 'Recruiter is not assigned to a company');
    }

    return user.companyIds;
  }

  private static assertCompanyAccess(user: AuthUser, companyId: string) {
    if (user.role === 'admin') return;
    if (!user.companyIds.includes(companyId)) {
      throw new AppError(403, 'AUTHORIZATION_ERROR', 'Company access denied');
    }
  }

  private static async requireRecruiterJob(user: AuthUser, jobId: string) {
    const { data, error } = await supabaseAdmin.from('jobs').select('*').eq('id', jobId).maybeSingle();
    if (error) throw new AppError(500, 'INTERNAL_ERROR', 'Failed to fetch job', error.message);
    if (!data) throw notFound('job');
    this.assertCompanyAccess(user, data.company_id as string);
    return data;
  }

  private static async requireRecruiterApplication(user: AuthUser, applicationId: string) {
    const { data, error } = await supabaseAdmin
      .from('applications')
      .select('*, jobs(company_id)')
      .eq('id', applicationId)
      .maybeSingle();

    if (error) throw new AppError(500, 'INTERNAL_ERROR', 'Failed to fetch application', error.message);
    if (!data) throw notFound('application');

    const job = data.jobs as { company_id?: string } | null;
    if (!job?.company_id) throw new AppError(500, 'INTERNAL_ERROR', 'Application job scope missing');
    this.assertCompanyAccess(user, job.company_id);
    return data;
  }

  private static sortResumeScores<T extends Record<string, unknown>>(resume: T): T {
    if (Array.isArray(resume.resume_scores)) {
      (resume as Record<string, unknown>).resume_scores = [...resume.resume_scores].sort((a, b) => {
        const aTime = Date.parse(String((a as Record<string, unknown>).created_at ?? ''));
        const bTime = Date.parse(String((b as Record<string, unknown>).created_at ?? ''));
        return bTime - aTime;
      });
    }
    return resume;
  }

  private static asRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
  }

  private static numberFrom(value: unknown) {
    return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
  }
}
