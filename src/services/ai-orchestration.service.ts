import { supabaseAdmin } from '../config/supabase';
import { AiServiceClient } from '../clients/aiService.client';
import { StorageService } from './storage.service';
import { AppError } from '../utils/errors';
import type { AuthUser } from '../types/auth';

export class AiOrchestrationService {
  static async extractResume(userId: string, payload: Record<string, unknown>) {
    const resumeId = payload.resumeId as string | undefined;
    const docId = (payload.documentId || payload.fileId) as string;
    if (!docId) throw new AppError(400, 'VALIDATION_ERROR', 'documentId is required');

    const document = await this.requireRow('documents', docId);
    if (document.owner_user_id !== userId) {
      throw new AppError(403, 'AUTHORIZATION_ERROR', 'Document access denied');
    }

    const fileContentBase64 = await this.downloadDocumentAsBase64(document.storage_path as string);
    const shouldSetPrimary = await this.shouldSetPrimaryResume(userId, payload.setPrimary === true);

    const aiResult = await AiServiceClient.extractResume({
      documentId: document.id,
      candidateId: document.owner_user_id,
      filePath: document.storage_path,
      fileName: document.file_name,
      fileContentBase64,
      sourceMimeType: document.mime_type,
      options: payload.options ?? {}
    });

    const extraction = this.getExtractionData(aiResult);
    await supabaseAdmin.from('document_extractions').insert({
      document_id: document.id,
      extraction_type: 'resume',
      ai_response: aiResult,
      status: this.isSuccessfulAiResult(aiResult) ? 'completed' : 'failed',
      confidence: this.pickConfidence(aiResult),
      warnings: this.pickWarnings(aiResult)
    });

    if (!this.isSuccessfulAiResult(aiResult) || !extraction.structuredResume) {
      return aiResult;
    }

    const resume = await this.upsertExtractedResume({
      candidateId: userId,
      ...(resumeId ? { resumeId } : {}),
      documentId: document.id as string,
      title: (payload.title as string | undefined) || this.titleFromFileName(document.file_name as string),
      structuredResume: extraction.structuredResume,
      setPrimary: shouldSetPrimary
    });

    if (resume.is_primary) {
      await this.syncCandidateProfileFromResume(userId, extraction.structuredResume);
    }

    return {
      ...this.toPlainObject(aiResult),
      resume,
      data: {
        ...extraction,
        resume
      }
    };
  }

  static async analyzeResume(userId: string, payload: Record<string, unknown>) {
    let resume = await this.requireCandidateResume(userId, payload.resumeId as string);
    if (this.isEmptyStructuredResume(resume.structured_data) && !resume.document_id) {
      const repairedDocument = await this.findDocumentForResume(userId, resume);
      if (repairedDocument?.id) {
        resume = {
          ...resume,
          document_id: repairedDocument.id
        };
      }
    }

    if (this.isEmptyStructuredResume(resume.structured_data) && !resume.document_id) {
      throw new AppError(
        409,
        'CONFLICT',
        'This resume has no extracted data and no uploaded source document. Upload the PDF/DOCX again so extraction can run.',
        { reason: 'SOURCE_DOCUMENT_MISSING' }
      );
    }

    if (this.isEmptyStructuredResume(resume.structured_data) && resume.document_id) {
      const extracted = await this.extractResume(userId, {
        resumeId: resume.id,
        documentId: resume.document_id,
        title: resume.title,
        setPrimary: resume.is_primary
      });
      const extractedResume = this.getNested(extracted, ['data', 'resume']);
      if (extractedResume && typeof extractedResume === 'object') {
        resume = extractedResume as Record<string, unknown>;
      }
    }

    if (this.isEmptyStructuredResume(resume.structured_data)) {
      throw new AppError(
        422,
        'UPSTREAM_ERROR',
        'Resume extraction completed but no usable structured data was produced. Check AI-Service extraction logs and document text readability.',
        { reason: 'RESUME_EXTRACTION_EMPTY' }
      );
    }

    const aiResult = await AiServiceClient.analyzeResume({
      ...payload,
      structuredResume: resume.structured_data
    });

    const persistenceStatus = await this.persistResumeScoreWithBudget(payload, aiResult);

    return {
      ...this.toPlainObject(aiResult),
      persistence: {
        resumeScore: persistenceStatus
      }
    };
  }

  static async matchJobs(payload: Record<string, unknown>) {
    if (!payload.resumeId) throw new AppError(400, 'VALIDATION_ERROR', 'resumeId is required');
    const candidateId = this.asString(payload.candidateId);
    if (!candidateId) throw new AppError(401, 'AUTHENTICATION_ERROR', 'Candidate context is required for job matching');
    let resume = await this.requireCandidateResume(candidateId, payload.resumeId as string);

    if (this.isEmptyStructuredResume(resume.structured_data) && resume.document_id) {
      const extracted = await this.extractResume(candidateId, {
        resumeId: resume.id,
        documentId: resume.document_id,
        title: resume.title,
        setPrimary: resume.is_primary
      });
      const extractedResume = this.getNested(extracted, ['data', 'resume']);
      if (extractedResume && typeof extractedResume === 'object') {
        resume = extractedResume as Record<string, unknown>;
      }
    }

    if (this.isEmptyStructuredResume(resume.structured_data)) {
      throw new AppError(
        409,
        'CONFLICT',
        'This resume has no extracted profile data. Run resume extraction before AI job matching.',
        { reason: 'RESUME_EXTRACTION_REQUIRED' }
      );
    }

    let jobsQuery = supabaseAdmin
      .from('jobs')
      .select('*, companies(id, name, website, industry)')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit((payload.limit as number | undefined) ?? 20);

    const filters = payload.filters as Record<string, any> | undefined;
    if (filters) {
      if (filters.q) jobsQuery = jobsQuery.or(`title.ilike.%${filters.q}%,description.ilike.%${filters.q}%`);
      if (filters.location) jobsQuery = jobsQuery.ilike('location', `%${filters.location}%`);
      if (filters.remoteType) jobsQuery = jobsQuery.eq('remote_type', filters.remoteType);
      if (filters.employmentType) jobsQuery = jobsQuery.eq('employment_type', filters.employmentType);
      if (filters.seniority) jobsQuery = jobsQuery.eq('seniority', filters.seniority);
      if (filters.minSalary !== undefined) jobsQuery = jobsQuery.gte('max_salary', filters.minSalary);
      if (filters.skill) jobsQuery = jobsQuery.contains('required_skills', [filters.skill]);
    }

    const { data: jobs, error } = await jobsQuery;

    if (error) throw new AppError(500, 'INTERNAL_ERROR', 'Failed to load jobs for matching', error.message);

    const aiResult = await AiServiceClient.matchJobs({
      ...payload,
      structuredResume: resume.structured_data,
      jobs: jobs ?? []
    });

    const matches = Array.isArray((aiResult as any)?.matches) 
      ? (aiResult as any).matches 
      : Array.isArray((aiResult as any)?.data?.matches)
        ? (aiResult as any).data.matches
        : [];

    const rowsToInsert = matches
      .map((match: any) => {
        const jobId = match.jobId || match.job_id;
        const score = match.matchScore || match.match_score;
        if (!jobId) return null;
        return {
          candidate_id: candidateId,
          resume_id: payload.resumeId,
          job_id: jobId,
          score: typeof score === 'number' ? score : null,
          result: match,
          updated_at: new Date().toISOString()
        };
      })
      .filter(Boolean);

    let persistence: Record<string, unknown> = {
      attempted: rowsToInsert.length,
      saved: 0,
      status: 'skipped'
    };

    // Non-fatal persistence
    try {
      if (rowsToInsert.length > 0) {
        const { error: matchSaveError } = await supabaseAdmin
          .from('candidate_job_matches')
          .upsert(rowsToInsert, { onConflict: 'candidate_id, job_id' });
        if (matchSaveError) {
          persistence = {
            attempted: rowsToInsert.length,
            saved: 0,
            status: 'failed',
            error: matchSaveError.message
          };
          console.warn('[matchJobs] Could not persist match result:', matchSaveError.message);
        } else {
          persistence = {
            attempted: rowsToInsert.length,
            saved: rowsToInsert.length,
            status: 'saved'
          };
        }
      }
    } catch (e) {
      persistence = {
        attempted: rowsToInsert.length,
        saved: 0,
        status: 'failed',
        error: (e as Error).message
      };
      console.warn('[matchJobs] Could not persist match result:', (e as Error).message);
    }

    return {
      ...this.toPlainObject(aiResult),
      persistence,
      matchRun: {
        candidateId,
        resumeId: payload.resumeId,
        totalJobsConsidered: (jobs ?? []).length,
        totalMatches: matches.length,
        generatedAt: new Date().toISOString()
      }
    };
  }

  static async scoreCandidates(user: AuthUser, payload: Record<string, unknown>) {
    const job = await this.requireRow('jobs', payload.jobId as string);
    this.assertRecruiterCanAccessCompany(user, job.company_id as string);
    let query = supabaseAdmin.from('applications').select('candidate_id, resume_id').eq('job_id', payload.jobId as string);
    const candidateIds = payload.candidateIds as string[] | undefined;
    if (candidateIds?.length) query = query.in('candidate_id', candidateIds);

    const { data: applications, error } = await query;
    if (error) throw new AppError(500, 'INTERNAL_ERROR', 'Failed to load applications for scoring', error.message);

    const applicationRows = applications ?? [];
    const resumeIds = applicationRows
      .map((application) => this.asString(application.resume_id))
      .filter((resumeId): resumeId is string => Boolean(resumeId));
    const candidateIdsNeedingResume = applicationRows
      .filter((application) => !this.asString(application.resume_id))
      .map((application) => this.asString(application.candidate_id))
      .filter((candidateId): candidateId is string => Boolean(candidateId));

    const { data: linkedResumes } = resumeIds.length
      ? await supabaseAdmin.from('resumes').select('*').in('id', resumeIds)
      : { data: [] };
    const { data: fallbackResumes } = candidateIdsNeedingResume.length
      ? await supabaseAdmin
          .from('resumes')
          .select('*')
          .in('candidate_id', candidateIdsNeedingResume)
          .eq('is_primary', true)
      : { data: [] };

    const resumes = [...(linkedResumes ?? []), ...(fallbackResumes ?? [])];
    const primaryResumeByCandidate = new Map<string, Record<string, unknown>>();
    for (const resume of fallbackResumes ?? []) {
      const candidateId = this.asString(resume.candidate_id);
      if (candidateId && !primaryResumeByCandidate.has(candidateId)) primaryResumeByCandidate.set(candidateId, resume);
    }
    const scoringApplications = applicationRows.map((application) => {
      if (this.asString(application.resume_id)) return application;
      const fallbackResume = primaryResumeByCandidate.get(String(application.candidate_id));
      return fallbackResume?.id ? { ...application, resume_id: fallbackResume.id } : application;
    });

    const aiResult = await AiServiceClient.scoreCandidates({
      job,
      applications: scoringApplications,
      resumes
    });

    await this.persistCandidateScoreRankings(payload.jobId as string, aiResult);

    return aiResult;
  }

  static async generateInterview(user: AuthUser, payload: Record<string, unknown>) {
    // Fetch full job object so AI service can generate role-specific questions
    let job: Record<string, unknown> = {};
    if (payload.jobId) {
      const { data, error } = await supabaseAdmin
        .from('jobs')
        .select('id, title, description, required_skills, nice_to_have_skills, seniority, department, location, remote_type, employment_type, company_id, companies(id, name, industry)')
        .eq('id', payload.jobId as string)
        .maybeSingle();
      if (error) throw new AppError(500, 'INTERNAL_ERROR', 'Failed to fetch job for interview generation', error.message);
      if (data) job = data as Record<string, unknown>;
      if (data && user.role === 'recruiter') this.assertRecruiterCanAccessCompany(user, data.company_id as string);
    }

    // Fetch candidate's primary resume for context
    let structuredResume: Record<string, unknown> = {};
    if (payload.candidateId) {
      if (user.role === 'candidate' && payload.candidateId !== user.id) {
        throw new AppError(403, 'AUTHORIZATION_ERROR', 'Candidate interview context denied');
      }
      if (user.role === 'recruiter' && payload.jobId) {
        const { data: application, error: applicationError } = await supabaseAdmin
          .from('applications')
          .select('id')
          .eq('job_id', payload.jobId as string)
          .eq('candidate_id', payload.candidateId as string)
          .maybeSingle();
        if (applicationError) throw new AppError(500, 'INTERNAL_ERROR', 'Failed to verify applicant context', applicationError.message);
        if (!application) throw new AppError(403, 'AUTHORIZATION_ERROR', 'Recruiter can only generate interviews for scoped applicants');
      }
      const { data: resume } = await supabaseAdmin
        .from('resumes')
        .select('structured_data')
        .eq('candidate_id', payload.candidateId as string)
        .eq('is_primary', true)
        .maybeSingle();
      if (resume?.structured_data) structuredResume = resume.structured_data as Record<string, unknown>;
    }

    const recruiterContext = user.role === 'recruiter' || user.role === 'admin'
      ? await this.buildRecruiterContext(user.id)
      : {};

    const aiResult = await AiServiceClient.generateInterview({
      ...payload,
      job,
      structuredResume,
      recruiterContext
    });

    // Non-fatal persistence
    try {
      await supabaseAdmin.from('interview_questions').insert({
        job_id: payload.jobId ?? null,
        candidate_id: payload.candidateId ?? null,
        resume_id: payload.resumeId ?? null,
        question: 'AI generated interview kit',
        question_type: 'technical',
        rubric: aiResult
      });
    } catch (e) {
      console.warn('[generateInterview] Could not persist questions:', (e as Error).message);
    }
    return aiResult;
  }

  static async evaluateMockInterview(payload: Record<string, unknown>) {
    const aiResult = await AiServiceClient.evaluateMockInterview(payload);
    // Non-fatal persistence
    try {
      await supabaseAdmin.from('mock_interview_evaluations').insert({
        mock_interview_id: payload.interviewSessionId ?? null,
        question_id: payload.questionId ?? null,
        answer_text: payload.answer,
        evaluation: aiResult
      });
    } catch (e) {
      console.warn('[evaluateMockInterview] Could not persist evaluation:', (e as Error).message);
    }
    return aiResult;
  }

  static async recruiterChat(userId: string, payload: Record<string, unknown>) {
    const recruiterContext = await this.buildRecruiterContext(userId);

    return AiServiceClient.recruiterChat({
      recruiterId: userId,
      ...payload,
      context: {
        ...this.asRecord(payload.context),
        recruiterContext
      }
    });
  }

  private static async buildRecruiterContext(userId: string) {
    const recruiter = await this.requireRow('users', userId);
    const { data: profile } = await supabaseAdmin
      .from('recruiter_profiles')
      .select('title, phone, timezone, companies(id, name, website, industry, size_range, description)')
      .eq('user_id', userId)
      .maybeSingle();

    const { data: memberships } = await supabaseAdmin
      .from('company_members')
      .select('company_id, role, companies(id, name, website, industry, size_range, description)')
      .eq('user_id', userId);
    const companyIds = (memberships ?? [])
      .map((membership) => membership.company_id)
      .filter((companyId): companyId is string => typeof companyId === 'string');
    const companies = (memberships ?? []).map((membership) => ({
      role: membership.role,
      ...this.asRecord(membership.companies)
    }));

    const { data: jobs } = companyIds.length
      ? await supabaseAdmin
          .from('jobs')
          .select('id, title, status, description, required_skills, nice_to_have_skills, seniority, department, location, remote_type, employment_type, company_id, companies(id, name, industry)')
          .in('company_id', companyIds)
          .order('created_at', { ascending: false })
          .limit(50)
      : { data: [] };

    const jobIds = (jobs ?? []).map((job) => job.id).filter((jobId): jobId is string => typeof jobId === 'string');
    const { data: applications } = jobIds.length
      ? await supabaseAdmin
          .from('applications')
          .select('id, status, job_id, candidate_id, resume_id, users(id, email, full_name), resumes(id, title, structured_data)')
          .in('job_id', jobIds)
          .order('created_at', { ascending: false })
          .limit(50)
      : { data: [] };

    const candidateIds = (applications ?? [])
      .map((application) => application.candidate_id)
      .filter((candidateId): candidateId is string => typeof candidateId === 'string');
    const { data: scores } = jobIds.length && candidateIds.length
      ? await supabaseAdmin
          .from('candidate_job_scores')
          .select('*')
          .in('job_id', jobIds)
          .in('candidate_id', candidateIds)
          .order('created_at', { ascending: false })
      : { data: [] };

    const latestScore = new Map<string, Record<string, unknown>>();
    for (const score of scores ?? []) {
      const key = `${score.job_id}:${score.candidate_id}`;
      if (!latestScore.has(key)) latestScore.set(key, score);
    }

    const applicants = (applications ?? []).map((application) => ({
      ...application,
      aiScore: this.normalizeRecruiterContextScore(latestScore.get(`${application.job_id}:${application.candidate_id}`))
    }));

    return {
      recruiter: {
        id: recruiter.id,
        email: recruiter.email,
        fullName: recruiter.full_name,
        role: recruiter.role,
        profile: profile ?? {}
      },
      companyIds,
      companies,
      jobs: jobs ?? [],
      applicants
    };
  }

  static async candidateChat(userId: string, payload: Record<string, unknown>) {
    // Fetch profile
    const { data: profile } = await supabaseAdmin
      .from('candidate_profiles')
      .select('headline, summary, location, desired_role, desired_salary_min, desired_salary_max, open_to_remote')
      .eq('user_id', userId)
      .maybeSingle();

    // Fetch primary resume (structured data)
    const { data: primaryResume } = await supabaseAdmin
      .from('resumes')
      .select('id, title, structured_data')
      .eq('candidate_id', userId)
      .eq('is_primary', true)
      .maybeSingle();

    // Fetch all resumes (titles only for reference)
    const { data: allResumes } = await supabaseAdmin
      .from('resumes')
      .select('id, title')
      .eq('candidate_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    // Fetch recent applications with job title context
    const { data: applications } = await supabaseAdmin
      .from('applications')
      .select('id, status, created_at, jobs(title, companies(name))')
      .eq('candidate_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    // Fetch open jobs for cover letter feature
    const { data: openJobs } = await supabaseAdmin
      .from('jobs')
      .select('id, title, description, required_skills, companies(name)')
      .eq('status', 'open')
      .limit(20);

    const candidateContext = {
      profile: profile ?? {},
      primaryResume: {
        id: primaryResume?.id,
        title: primaryResume?.title,
        structuredData: primaryResume?.structured_data ?? {}
      },
      allResumes: allResumes ?? [],
      recentApplications: (applications ?? []).map((a: Record<string, unknown>) => ({
        status: a.status,
        jobTitle: (a.jobs as Record<string, unknown> | null)?.title ?? 'Unknown',
        company: this.asRecord((a.jobs as Record<string, unknown> | null)?.companies).name ?? 'Unknown'
      })),
      availableJobs: (openJobs ?? []).map((j: Record<string, unknown>) => ({
        id: j.id,
        title: j.title,
        company: this.asRecord(j.companies).name,
        requiredSkills: j.required_skills
      }))
    };

    return AiServiceClient.candidateChat({
      candidateId: userId,
      ...payload,
      candidateContext
    });
  }

  static getTask(taskId: string) {
    return AiServiceClient.getTask(taskId);
  }

  private static async persistResumeScoreWithBudget(payload: Record<string, unknown>, aiResult: unknown) {
    const savePromise = this.persistResumeScore(payload, aiResult);
    const handledSavePromise = savePromise
      .then(() => 'saved' as const)
      .catch((error: unknown) => {
        console.error('Failed to save resume score:', error);
        return 'failed' as const;
      });

    const status = await Promise.race([
      handledSavePromise,
      this.delay(2500).then(() => 'queued' as const)
    ]);

    if (status === 'queued') {
      void handledSavePromise;
    }

    return status;
  }

  private static async persistResumeScore(payload: Record<string, unknown>, aiResult: unknown) {
    const { error } = await supabaseAdmin.from('resume_scores').insert({
      resume_id: payload.resumeId,
      target_role: payload.targetRole ?? 'General Match',
      score: this.pickScore(aiResult),
      breakdown: this.pickBreakdown(aiResult),
      suggestions: this.pickArray(aiResult, 'suggestions'),
      warnings: this.pickArray(aiResult, 'warnings').map(String)
    });

    if (error) {
      throw error;
    }
  }

  private static delay(ms: number) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  private static async persistCandidateScoreRankings(jobId: string, aiResult: unknown) {
    const rankings = this.pickRankings(aiResult);
    if (!rankings.length) return;

    const rows = rankings
      .map((ranking) => {
        const candidateId = this.asString(ranking.candidateId ?? ranking.candidate_id);
        const resumeId = this.asString(ranking.resumeId ?? ranking.resume_id);
        if (!candidateId) return null;
        return {
          job_id: jobId,
          candidate_id: candidateId,
          resume_id: resumeId ?? null,
          score: this.numberFrom(ranking.score) ?? 0,
          matched_requirements: this.arrayFrom(ranking.matchedRequirements ?? ranking.matched_requirements),
          missing_requirements: this.arrayFrom(ranking.missingRequirements ?? ranking.missing_requirements),
          evidence: this.asRecord(ranking.evidence),
          confidence: this.numberFrom(ranking.confidence) ?? null,
          warnings: this.arrayFrom(ranking.warnings).map(String),
          result: ranking
        };
      })
      .filter((row): row is NonNullable<typeof row> => Boolean(row));

    if (!rows.length) return;

    const { error } = await supabaseAdmin.from('candidate_job_scores').insert(rows);
    if (error) {
      console.error('Failed to persist candidate score rankings:', error);
    }
  }

  private static assertRecruiterCanAccessCompany(user: AuthUser, companyId: string) {
    if (user.role === 'admin') return;
    if (!user.companyIds.includes(companyId)) {
      throw new AppError(403, 'AUTHORIZATION_ERROR', 'Company access denied');
    }
  }

  private static pickRankings(result: unknown): Record<string, unknown>[] {
    const rankings = this.getNested(result, ['rankings']) ?? this.getNested(result, ['data', 'rankings']);
    return Array.isArray(rankings) ? rankings.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object' && !Array.isArray(item)) : [];
  }

  private static normalizeRecruiterContextScore(scoreRow?: Record<string, unknown>) {
    if (!scoreRow) return null;
    const result = this.asRecord(scoreRow.result);
    const matched = this.arrayFrom(scoreRow.matched_requirements ?? result.matchedRequirements ?? result.matched_requirements);
    const missing = this.arrayFrom(scoreRow.missing_requirements ?? result.missingRequirements ?? result.missing_requirements);
    return {
      score: this.numberFrom(scoreRow.score) ?? this.numberFrom(result.score),
      confidence: this.numberFrom(scoreRow.confidence) ?? this.numberFrom(result.confidence),
      matchedRequirements: matched.slice(0, 8),
      missingRequirements: missing.slice(0, 8),
      concerns: this.arrayFrom(result.concerns).slice(0, 5),
      interviewFocus: this.arrayFrom(result.interviewFocus ?? result.interview_focus).slice(0, 5)
    };
  }

  private static async requireRow(tableName: string, id: string) {
    const { data, error } = await supabaseAdmin.from(tableName).select('*').eq('id', id).single();
    if (error || !data) throw new AppError(404, 'NOT_FOUND', `${tableName} row not found`);
    return data;
  }

  private static async requireCandidateResume(userId: string, resumeId: string) {
    const { data, error } = await supabaseAdmin
      .from('resumes')
      .select('*')
      .eq('id', resumeId)
      .eq('candidate_id', userId)
      .maybeSingle();
    if (error) throw new AppError(500, 'INTERNAL_ERROR', 'Failed to fetch resume', error.message);
    if (!data) throw new AppError(404, 'NOT_FOUND', 'resume row not found');
    return data;
  }

  private static async downloadDocumentAsBase64(storagePath: string) {
    const data = await StorageService.downloadResume(storagePath);

    if (Buffer.isBuffer(data)) return data.toString('base64');
    if (data instanceof ArrayBuffer) return Buffer.from(data).toString('base64');
    if (data instanceof Blob) {
      return Buffer.from(await data.arrayBuffer()).toString('base64');
    }

    throw new AppError(500, 'INTERNAL_ERROR', 'Unsupported document payload returned by storage');
  }

  private static async shouldSetPrimaryResume(candidateId: string, requested: boolean) {
    if (requested) return true;
    const { data, error } = await supabaseAdmin
      .from('resumes')
      .select('id')
      .eq('candidate_id', candidateId)
      .eq('is_primary', true)
      .limit(1);
    if (error) throw new AppError(500, 'INTERNAL_ERROR', 'Failed to inspect primary resume', error.message);
    return !data?.length;
  }

  private static async upsertExtractedResume(input: {
    candidateId: string;
    resumeId?: string;
    documentId: string;
    title: string;
    structuredResume: Record<string, unknown>;
    setPrimary: boolean;
  }) {
    if (input.setPrimary) {
      const { error } = await supabaseAdmin
        .from('resumes')
        .update({ is_primary: false, updated_at: new Date().toISOString() })
        .eq('candidate_id', input.candidateId);
      if (error) throw new AppError(400, 'VALIDATION_ERROR', 'Failed to clear primary resume', error.message);
    }

    const existingQuery = input.resumeId
      ? supabaseAdmin.from('resumes').select('*').eq('id', input.resumeId).eq('candidate_id', input.candidateId)
      : supabaseAdmin.from('resumes').select('*').eq('candidate_id', input.candidateId).eq('document_id', input.documentId);
    const { data: existing, error: existingError } = await existingQuery.maybeSingle();
    if (existingError) throw new AppError(500, 'INTERNAL_ERROR', 'Failed to inspect existing resume', existingError.message);

    const payload = {
      candidate_id: input.candidateId,
      document_id: input.documentId,
      title: input.title,
      structured_data: input.structuredResume,
      is_primary: input.setPrimary || Boolean(existing?.is_primary),
      updated_at: new Date().toISOString()
    };

    const query = existing
      ? supabaseAdmin.from('resumes').update(payload).eq('id', existing.id)
      : supabaseAdmin.from('resumes').insert(payload);

    const { data, error } = await query.select('*, documents(id, file_name, mime_type, storage_path), resume_scores(*)').single();
    if (error) throw new AppError(400, 'VALIDATION_ERROR', 'Failed to save extracted resume', error.message);
    return this.sortResumeScores(data);
  }

  private static async findDocumentForResume(candidateId: string, resume: Record<string, unknown>) {
    const resumeTitle = this.normalizeTitle(String(resume.title ?? ''));
    const { data, error } = await supabaseAdmin
      .from('documents')
      .select('*')
      .eq('owner_user_id', candidateId)
      .eq('document_type', 'resume')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw new AppError(500, 'INTERNAL_ERROR', 'Failed to find source resume document', error.message);
    const documents = data ?? [];
    if (!documents.length) return null;

    const exact = documents.find((document) => this.normalizeTitle(String(document.file_name ?? '')) === resumeTitle);
    if (exact) return exact;

    const partial = documents.find((document) => {
      const fileTitle = this.normalizeTitle(String(document.file_name ?? ''));
      return Boolean(resumeTitle && (fileTitle.includes(resumeTitle) || resumeTitle.includes(fileTitle)));
    });
    if (partial) return partial;

    return documents.length === 1 ? documents[0] : null;
  }

  private static async syncCandidateProfileFromResume(candidateId: string, structuredResume: Record<string, unknown>) {
    const contact = this.asRecord(structuredResume.contact);
    const experience = Array.isArray(structuredResume.experience) ? structuredResume.experience : [];
    const firstExperience = this.asRecord(experience[0]);
    const patch: Record<string, unknown> = {
      user_id: candidateId,
      updated_at: new Date().toISOString()
    };

    const summary = this.asString(structuredResume.summary);
    const title = this.asString(firstExperience.title);
    const location = this.asString(contact.location);
    const portfolio = this.asString(contact.portfolio);
    const github = this.asString(contact.github);
    const linkedin = this.asString(contact.linkedin);

    if (summary) patch.summary = summary;
    if (title) patch.headline = title;
    if (location) patch.location = location;
    if (portfolio) patch.portfolio_url = portfolio;
    if (github) patch.github_url = github;
    if (linkedin) patch.linkedin_url = linkedin;

    if (Object.keys(patch).length <= 2) return;

    const { error } = await supabaseAdmin
      .from('candidate_profiles')
      .upsert(patch, { onConflict: 'user_id' });
    if (error) {
      console.error('Failed to sync candidate profile from resume:', error);
    }
  }

  private static pickScore(result: unknown) {
    if (typeof result === 'object' && result !== null && 'score' in result && typeof result.score === 'number') {
      return result.score;
    }
    return 0;
  }

  private static pickArray(result: unknown, key: string) {
    if (typeof result === 'object' && result !== null && key in result && Array.isArray(result[key as keyof typeof result])) {
      return result[key as keyof typeof result];
    }
    return [];
  }

  private static pickBreakdown(result: unknown) {
    const breakdown = this.getNested(result, ['breakdown']) ?? this.getNested(result, ['data', 'breakdown']);
    return this.asRecord(breakdown);
  }

  private static getExtractionData(result: unknown) {
    const data = this.getNested(result, ['data']);
    const structuredResume = this.getNested(result, ['data', 'structuredResume'])
      ?? this.getNested(result, ['data', 'structured_resume']);
    return {
      ...(this.asRecord(data)),
      structuredResume: this.asRecord(structuredResume)
    };
  }

  private static isSuccessfulAiResult(result: unknown) {
    const success = this.getNested(result, ['success']);
    return success === true;
  }

  private static pickConfidence(result: unknown) {
    const value = this.getNested(result, ['confidence']);
    return typeof value === 'number' ? value : null;
  }

  private static pickWarnings(result: unknown) {
    const warnings = this.getNested(result, ['warnings']);
    return Array.isArray(warnings) ? warnings.map((warning) => String(warning)) : [];
  }

  private static toPlainObject(result: unknown): Record<string, unknown> {
    return this.asRecord(result);
  }

  private static getNested(value: unknown, path: string[]) {
    let cursor = value;
    for (const key of path) {
      if (!cursor || typeof cursor !== 'object' || !(key in cursor)) return undefined;
      cursor = (cursor as Record<string, unknown>)[key];
    }
    return cursor;
  }

  private static asRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
  }

  private static asString(value: unknown) {
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }

  private static numberFrom(value: unknown) {
    return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
  }

  private static arrayFrom(value: unknown) {
    return Array.isArray(value) ? value : [];
  }

  private static titleFromFileName(fileName: string) {
    return fileName.replace(/\.[^.]+$/, '').slice(0, 160) || 'Resume';
  }

  private static normalizeTitle(value: string) {
    return value
      .replace(/\.[^.]+$/, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '');
  }

  private static isEmptyStructuredResume(value: unknown) {
    const structured = this.asRecord(value);
    if (!Object.keys(structured).length) return true;
    const skills = structured.skills;
    const experience = structured.experience;
    const education = structured.education;
    return !(
      (Array.isArray(skills) && skills.length) ||
      (Array.isArray(experience) && experience.length) ||
      (Array.isArray(education) && education.length)
    );
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
}
