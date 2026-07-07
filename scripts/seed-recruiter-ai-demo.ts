import dotenv from 'dotenv';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';

dotenv.config();
Object.assign(globalThis, { WebSocket: require('ws') });

type CompanySeed = {
  name: string;
  website: string;
  industry: string;
  size_range: string;
  description: string;
  recruiter: {
    email: string;
    fullName: string;
    title: string;
  };
  jobs: JobSeed[];
};

type JobSeed = {
  title: string;
  department: string;
  location: string;
  remote_type: 'onsite' | 'hybrid' | 'remote';
  employment_type: 'full_time' | 'part_time' | 'contract' | 'internship';
  seniority: 'intern' | 'junior' | 'mid' | 'senior' | 'lead' | 'principal';
  min_salary: number;
  max_salary: number;
  required_skills: string[];
  nice_to_have_skills: string[];
  description: string;
};

type CandidateSeed = {
  email: string;
  fullName: string;
  fileName: string;
};

const PASSWORD = 'Test123!';
const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'resumes';
const rootDir = path.resolve(__dirname, '..', '..');
const testDataDir = path.join(rootDir, 'AI-Service', 'test-data');
const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const aiServiceApiKey = process.env.AI_SERVICE_API_KEY || 'local-dev-ai-service-key';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in backend/.env');
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const companies: CompanySeed[] = [
  {
    name: 'Zikra Infortech',
    website: 'https://zikrainfortech.com',
    industry: 'AI software, cloud platforms, and product engineering',
    size_range: '51-200',
    description: 'Zikra Infortech builds AI-enabled hiring, mobile, SaaS, and cloud products for growth-stage businesses.',
    recruiter: {
      email: 'recruiter.zikra@hireos.demo',
      fullName: 'Ayesha Zikra',
      title: 'Lead Technical Recruiter'
    },
    jobs: [
      {
        title: 'AI Mobile App Engineer',
        department: 'Product Engineering',
        location: 'Islamabad, Pakistan',
        remote_type: 'hybrid',
        employment_type: 'full_time',
        seniority: 'mid',
        min_salary: 300000,
        max_salary: 520000,
        required_skills: ['React Native', 'TypeScript', 'REST API integration', 'Firebase', 'Mobile architecture'],
        nice_to_have_skills: ['AI features', 'Flutter', 'MVVM', 'App performance'],
        description: 'Build mobile hiring and career-coach experiences with React Native, typed API integrations, authentication flows, offline-aware UX, and AI-powered resume/interview features.'
      },
      {
        title: 'Full Stack AI Product Engineer',
        department: 'AI Engineering',
        location: 'Remote',
        remote_type: 'remote',
        employment_type: 'full_time',
        seniority: 'senior',
        min_salary: 450000,
        max_salary: 720000,
        required_skills: ['Next.js', 'Node.js', 'FastAPI', 'PostgreSQL', 'LLM APIs'],
        nice_to_have_skills: ['LangGraph', 'Supabase', 'Redis', 'Celery'],
        description: 'Own complete AI product slices across frontend, backend, and AI-Service. You will build typed APIs, structured AI workflows, scoring tools, and polished recruiter/candidate screens.'
      },
      {
        title: 'Backend Engineer - Hiring Marketplace',
        department: 'Backend',
        location: 'Lahore, Pakistan',
        remote_type: 'hybrid',
        employment_type: 'full_time',
        seniority: 'mid',
        min_salary: 280000,
        max_salary: 460000,
        required_skills: ['Node.js', 'TypeScript', 'Express', 'Supabase', 'PostgreSQL'],
        nice_to_have_skills: ['JWT auth', 'RLS', 'Redis', 'API testing'],
        description: 'Design secure marketplace APIs for jobs, applications, recruiter workflows, resume storage, role-based access, and AI-Service orchestration.'
      },
      {
        title: 'AI Workflow Engineer',
        department: 'AI Engineering',
        location: 'Remote',
        remote_type: 'remote',
        employment_type: 'full_time',
        seniority: 'mid',
        min_salary: 360000,
        max_salary: 600000,
        required_skills: ['Python', 'FastAPI', 'Pydantic', 'OpenAI API', 'Prompt engineering'],
        nice_to_have_skills: ['LangGraph', 'Celery', 'Redis', 'Document extraction'],
        description: 'Build typed AI tools for resume extraction, ATS scoring, candidate ranking, interview generation, recruiter chat, and candidate career coaching.'
      },
      {
        title: 'Product Designer - AI Hiring',
        department: 'Design',
        location: 'Karachi, Pakistan',
        remote_type: 'hybrid',
        employment_type: 'full_time',
        seniority: 'mid',
        min_salary: 220000,
        max_salary: 380000,
        required_skills: ['Product design', 'Figma', 'Dashboard UX', 'Design systems', 'Prototyping'],
        nice_to_have_skills: ['AI products', 'Recruiter workflows', 'Motion design'],
        description: 'Design dense, workflow-oriented recruiter and candidate dashboards that make AI scoring, extraction, matching, and interview insights easy to trust and act on.'
      }
    ]
  },
  {
    name: 'NovaCloud Systems',
    website: 'https://novacloud.example',
    industry: 'Cloud infrastructure and DevOps consulting',
    size_range: '201-500',
    description: 'NovaCloud Systems delivers cloud modernization, platform engineering, observability, and DevOps automation for enterprise teams.',
    recruiter: {
      email: 'recruiter.novacloud@hireos.demo',
      fullName: 'Hamza Nova',
      title: 'Cloud Talent Partner'
    },
    jobs: [
      {
        title: 'Cloud Platform Engineer',
        department: 'Infrastructure',
        location: 'Remote',
        remote_type: 'remote',
        employment_type: 'full_time',
        seniority: 'senior',
        min_salary: 500000,
        max_salary: 800000,
        required_skills: ['AWS', 'Kubernetes', 'Terraform', 'Docker', 'Linux'],
        nice_to_have_skills: ['Helm', 'GitOps', 'Cost optimization'],
        description: 'Design secure cloud platforms, automate infrastructure, manage Kubernetes clusters, and improve deployment reliability for customer workloads.'
      },
      {
        title: 'Site Reliability Engineer',
        department: 'Reliability',
        location: 'Lahore, Pakistan',
        remote_type: 'hybrid',
        employment_type: 'full_time',
        seniority: 'mid',
        min_salary: 350000,
        max_salary: 590000,
        required_skills: ['Monitoring', 'Incident response', 'SLOs', 'Linux', 'Scripting'],
        nice_to_have_skills: ['Prometheus', 'Grafana', 'OpenTelemetry'],
        description: 'Own reliability practices including alerting, runbooks, incident response, capacity planning, and production readiness reviews.'
      },
      {
        title: 'DevOps Automation Engineer',
        department: 'DevOps',
        location: 'Islamabad, Pakistan',
        remote_type: 'hybrid',
        employment_type: 'full_time',
        seniority: 'mid',
        min_salary: 300000,
        max_salary: 520000,
        required_skills: ['CI/CD', 'Docker', 'GitHub Actions', 'Bash', 'Cloud deployments'],
        nice_to_have_skills: ['Ansible', 'Terraform', 'Node.js'],
        description: 'Build deployment pipelines, automate release checks, improve environment consistency, and reduce manual operational work.'
      },
      {
        title: 'Security Operations Analyst',
        department: 'Security',
        location: 'Karachi, Pakistan',
        remote_type: 'onsite',
        employment_type: 'full_time',
        seniority: 'junior',
        min_salary: 180000,
        max_salary: 320000,
        required_skills: ['Security monitoring', 'SIEM', 'OWASP', 'Access control', 'Incident triage'],
        nice_to_have_skills: ['Cloud security', 'SOC2', 'Threat modeling'],
        description: 'Monitor security events, triage alerts, review access controls, and support security readiness for cloud and SaaS systems.'
      },
      {
        title: 'Data Platform Engineer',
        department: 'Data',
        location: 'Remote',
        remote_type: 'remote',
        employment_type: 'full_time',
        seniority: 'mid',
        min_salary: 360000,
        max_salary: 610000,
        required_skills: ['Python', 'SQL', 'ETL', 'PostgreSQL', 'Data modeling'],
        nice_to_have_skills: ['Airflow', 'dbt', 'Vector databases'],
        description: 'Build data pipelines, model product analytics, maintain reliable warehouse jobs, and support AI workflows with clean retrieval-ready datasets.'
      }
    ]
  },
  {
    name: 'TalentForge Labs',
    website: 'https://talentforge.example',
    industry: 'HR technology and recruiting operations',
    size_range: '11-50',
    description: 'TalentForge Labs helps recruiting teams improve sourcing, screening, interview quality, and candidate experience using workflow automation.',
    recruiter: {
      email: 'recruiter.talentforge@hireos.demo',
      fullName: 'Sana Forge',
      title: 'Recruiting Operations Manager'
    },
    jobs: [
      {
        title: 'Recruiting Operations Specialist',
        department: 'People',
        location: 'Islamabad, Pakistan',
        remote_type: 'hybrid',
        employment_type: 'full_time',
        seniority: 'mid',
        min_salary: 180000,
        max_salary: 310000,
        required_skills: ['Recruiting', 'Screening', 'ATS', 'Interview coordination', 'Candidate experience'],
        nice_to_have_skills: ['Technical hiring', 'Analytics', 'Employer branding'],
        description: 'Run hiring operations from intake to interview scheduling while keeping candidate records, pipeline stages, and recruiter communication clean.'
      },
      {
        title: 'HR Tech Implementation Consultant',
        department: 'Customer Success',
        location: 'Remote',
        remote_type: 'remote',
        employment_type: 'full_time',
        seniority: 'mid',
        min_salary: 260000,
        max_salary: 440000,
        required_skills: ['SaaS onboarding', 'Workflow design', 'Customer communication', 'Documentation', 'API basics'],
        nice_to_have_skills: ['HRIS', 'Zapier', 'SQL basics'],
        description: 'Configure HR tech workflows, onboard customers, document process requirements, and coordinate integration needs with product teams.'
      },
      {
        title: 'Talent Analytics Analyst',
        department: 'Analytics',
        location: 'Lahore, Pakistan',
        remote_type: 'hybrid',
        employment_type: 'full_time',
        seniority: 'junior',
        min_salary: 170000,
        max_salary: 300000,
        required_skills: ['Excel', 'SQL basics', 'Dashboarding', 'Data cleaning', 'Recruiting metrics'],
        nice_to_have_skills: ['Power BI', 'Looker', 'PostgreSQL'],
        description: 'Analyze hiring funnels, time-to-hire, source quality, candidate drop-off, and recruiter activity to improve talent operations.'
      },
      {
        title: 'Frontend Engineer - HR Tools',
        department: 'Engineering',
        location: 'Remote',
        remote_type: 'remote',
        employment_type: 'full_time',
        seniority: 'mid',
        min_salary: 280000,
        max_salary: 470000,
        required_skills: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Forms'],
        nice_to_have_skills: ['Accessibility', 'React Query', 'shadcn/ui'],
        description: 'Build practical recruiter dashboards, candidate tables, interview kits, analytics panels, and AI assistant interfaces for HR teams.'
      },
      {
        title: 'Customer Success Manager - Recruiting SaaS',
        department: 'Customer Success',
        location: 'Karachi, Pakistan',
        remote_type: 'hybrid',
        employment_type: 'full_time',
        seniority: 'mid',
        min_salary: 240000,
        max_salary: 390000,
        required_skills: ['Customer success', 'Account management', 'Recruiting workflows', 'Training', 'Retention'],
        nice_to_have_skills: ['B2B SaaS', 'CRM', 'Product feedback'],
        description: 'Own customer outcomes for recruiting teams, support onboarding, run training sessions, collect feedback, and reduce churn risk.'
      }
    ]
  }
];

const candidates: CandidateSeed[] = [
  {
    email: 'candidate.areeba@hireos.demo',
    fullName: 'Areeba Khan',
    fileName: 'Blue and White Simple Professional CV Resume.pdf'
  },
  {
    email: 'candidate.sara@hireos.demo',
    fullName: 'Sara Malik',
    fileName: 'Currículum Vitae CV Empleo Moderno Beige y Verde.pdf'
  },
  {
    email: 'candidate.bilal@hireos.demo',
    fullName: 'Bilal Ahmed',
    fileName: 'Minimalist Modern Professional CV Resume.pdf'
  },
  {
    email: 'candidate.abdullah@hireos.demo',
    fullName: 'M Abdullah Jilani',
    fileName: 'M__Abdullah_Jilani.pdf'
  }
];

async function findAuthUserByEmail(client: SupabaseClient, email: string): Promise<User | null> {
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`Failed to list auth users: ${error.message}`);
    const found = data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
    if (found) return found;
    if (data.users.length < 1000) break;
  }
  return null;
}

async function ensureAuthUser(client: SupabaseClient, input: { email: string; fullName: string; role: 'candidate' | 'recruiter' }) {
  let authUser = await findAuthUserByEmail(client, input.email);
  if (!authUser) {
    const { data, error } = await client.auth.admin.createUser({
      email: input.email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: input.fullName, role: input.role },
      app_metadata: { role: input.role }
    });
    if (error || !data.user) throw new Error(`Failed to create ${input.email}: ${error?.message}`);
    authUser = data.user;
  }

  const { error: updateError } = await client.auth.admin.updateUserById(authUser.id, {
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: input.fullName, role: input.role },
    app_metadata: { role: input.role }
  });
  if (updateError) throw new Error(`Failed to update auth user ${input.email}: ${updateError.message}`);

  const { error: userError } = await client.from('users').upsert(
    {
      id: authUser.id,
      email: input.email,
      full_name: input.fullName,
      role: input.role
    },
    { onConflict: 'id' }
  );
  if (userError) throw new Error(`Failed to upsert user ${input.email}: ${userError.message}`);

  return { id: authUser.id, email: input.email, fullName: input.fullName };
}

async function ensureBucket(client: SupabaseClient) {
  let error: { message: string } | null = null;
  try {
    const result = await client.storage.createBucket(bucket, { public: false });
    error = result.error;
  } catch (cause) {
    throw new Error(`Unable to reach Supabase Storage while ensuring bucket ${bucket}: ${cause instanceof Error ? cause.message : String(cause)}`);
  }
  if (error && !error.message.toLowerCase().includes('already')) {
    throw new Error(`Failed to ensure storage bucket ${bucket}: ${error.message}`);
  }
}

async function ensureCompany(client: SupabaseClient, company: CompanySeed) {
  const payload = {
    name: company.name,
    website: company.website,
    industry: company.industry,
    size_range: company.size_range,
    description: company.description
  };
  const { data: existing, error: selectError } = await client.from('companies').select('id').eq('name', company.name).maybeSingle();
  if (selectError) throw new Error(`Failed to inspect company ${company.name}: ${selectError.message}`);
  if (existing) {
    const { data, error } = await client.from('companies').update(payload).eq('id', existing.id).select('id, name').single();
    if (error) throw new Error(`Failed to update company ${company.name}: ${error.message}`);
    return data;
  }
  const { data, error } = await client.from('companies').insert(payload).select('id, name').single();
  if (error) throw new Error(`Failed to create company ${company.name}: ${error.message}`);
  return data;
}

async function ensureRecruiter(client: SupabaseClient, companyId: string, company: CompanySeed) {
  const recruiter = await ensureAuthUser(client, {
    email: company.recruiter.email,
    fullName: company.recruiter.fullName,
    role: 'recruiter'
  });

  const { error: profileError } = await client.from('recruiter_profiles').upsert(
    {
      user_id: recruiter.id,
      company_id: companyId,
      title: company.recruiter.title,
      timezone: 'Asia/Karachi'
    },
    { onConflict: 'user_id' }
  );
  if (profileError) throw new Error(`Failed to upsert recruiter profile ${company.recruiter.email}: ${profileError.message}`);

  const { error: memberError } = await client.from('company_members').upsert(
    {
      company_id: companyId,
      user_id: recruiter.id,
      role: 'owner'
    },
    { onConflict: 'company_id,user_id' }
  );
  if (memberError) throw new Error(`Failed to upsert company member ${company.recruiter.email}: ${memberError.message}`);

  return recruiter;
}

async function ensureJob(client: SupabaseClient, companyId: string, job: JobSeed) {
  const payload = {
    ...job,
    company_id: companyId,
    currency: 'PKR',
    status: 'open',
    published_at: new Date().toISOString()
  };
  const { data: existing, error: selectError } = await client
    .from('jobs')
    .select('id')
    .eq('company_id', companyId)
    .eq('title', job.title)
    .maybeSingle();
  if (selectError) throw new Error(`Failed to inspect job ${job.title}: ${selectError.message}`);
  if (existing) {
    const { data, error } = await client.from('jobs').update(payload).eq('id', existing.id).select('*').single();
    if (error) throw new Error(`Failed to update job ${job.title}: ${error.message}`);
    return data;
  }
  const { data, error } = await client.from('jobs').insert(payload).select('*').single();
  if (error) throw new Error(`Failed to create job ${job.title}: ${error.message}`);
  return data;
}

async function callAiService<T>(pathName: string, payload: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${aiServiceUrl}${pathName}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': aiServiceApiKey
      },
      body: JSON.stringify(payload)
    });
  } catch (cause) {
    throw new Error(`Unable to reach AI-Service at ${aiServiceUrl}${pathName}: ${cause instanceof Error ? cause.message : String(cause)}`);
  }
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(`AI-Service ${pathName} failed (${response.status}): ${JSON.stringify(body)}`);
  }
  return body as T;
}

function structuredResumeFromExtraction(result: Record<string, any>) {
  return result.data?.structuredResume ?? result.data?.structured_resume;
}

async function extractAndSaveResume(client: SupabaseClient, candidate: { id: string; email: string; fullName: string }, fileName: string) {
  const filePath = path.join(testDataDir, fileName);
  const buffer = await fs.readFile(filePath);
  const storagePath = `demo-candidates/${candidate.id}/${fileName}`;
  const { error: uploadError } = await client.storage.from(bucket).upload(storagePath, buffer, {
    contentType: 'application/pdf',
    upsert: true
  });
  if (uploadError) throw new Error(`Failed to upload ${fileName}: ${uploadError.message}`);

  const { data: existingDocument, error: documentSelectError } = await client
    .from('documents')
    .select('id')
    .eq('owner_user_id', candidate.id)
    .eq('storage_path', storagePath)
    .maybeSingle();
  if (documentSelectError) throw new Error(`Failed to inspect document ${fileName}: ${documentSelectError.message}`);

  const documentPayload = {
    owner_user_id: candidate.id,
    storage_path: storagePath,
    file_name: fileName,
    mime_type: 'application/pdf',
    size_bytes: buffer.byteLength,
    document_type: 'resume'
  };
  const documentResult = existingDocument
    ? await client.from('documents').update(documentPayload).eq('id', existingDocument.id).select('*').single()
    : await client.from('documents').insert(documentPayload).select('*').single();
  if (documentResult.error) throw new Error(`Failed to save document ${fileName}: ${documentResult.error.message}`);
  const document = documentResult.data;

  const extraction = await callAiService<Record<string, any>>('/ai/resumes/extract', {
    documentId: document.id,
    candidateId: candidate.id,
    fileName,
    fileContentBase64: buffer.toString('base64'),
    sourceMimeType: 'application/pdf',
    options: { includeRawSections: true }
  });
  const structuredResume = structuredResumeFromExtraction(extraction);
  if (!extraction.success || !structuredResume) {
    throw new Error(`AI extraction failed for ${fileName}: ${JSON.stringify(extraction.error ?? extraction.warnings)}`);
  }

  await client.from('document_extractions').insert({
    document_id: document.id,
    extraction_type: 'resume',
    status: 'completed',
    ai_response: extraction,
    confidence: typeof extraction.confidence === 'number' ? extraction.confidence : null,
    warnings: Array.isArray(extraction.warnings) ? extraction.warnings.map(String) : []
  });

  await client.from('resumes').update({ is_primary: false }).eq('candidate_id', candidate.id);
  const { data: existingResume, error: resumeSelectError } = await client
    .from('resumes')
    .select('id')
    .eq('candidate_id', candidate.id)
    .eq('document_id', document.id)
    .maybeSingle();
  if (resumeSelectError) throw new Error(`Failed to inspect resume for ${candidate.email}: ${resumeSelectError.message}`);

  const resumePayload = {
    candidate_id: candidate.id,
    document_id: document.id,
    title: fileName.replace(/\.[^.]+$/, ''),
    structured_data: structuredResume,
    is_primary: true
  };
  const resumeResult = existingResume
    ? await client.from('resumes').update(resumePayload).eq('id', existingResume.id).select('*').single()
    : await client.from('resumes').insert(resumePayload).select('*').single();
  if (resumeResult.error) throw new Error(`Failed to save resume for ${candidate.email}: ${resumeResult.error.message}`);

  const contact = structuredResume.contact ?? {};
  const firstExperience = Array.isArray(structuredResume.experience) ? structuredResume.experience[0] ?? {} : {};
  await client.from('candidate_profiles').upsert(
    {
      user_id: candidate.id,
      headline: firstExperience.title ?? structuredResume.summary ?? 'HireOS demo candidate',
      summary: structuredResume.summary ?? null,
      location: contact.location ?? null,
      portfolio_url: contact.portfolio ?? null,
      github_url: contact.github ?? null,
      linkedin_url: contact.linkedin ?? null,
      open_to_remote: true
    },
    { onConflict: 'user_id' }
  );

  return {
    resume: resumeResult.data,
    structuredResume,
    extractionConfidence: extraction.confidence
  };
}

async function ensureApplication(client: SupabaseClient, jobId: string, candidateId: string, resumeId: string) {
  const { data: existing, error: selectError } = await client
    .from('applications')
    .select('id')
    .eq('job_id', jobId)
    .eq('candidate_id', candidateId)
    .maybeSingle();
  if (selectError) throw new Error(`Failed to inspect application: ${selectError.message}`);
  const payload = {
    job_id: jobId,
    candidate_id: candidateId,
    resume_id: resumeId,
    status: 'applied',
    source: 'hireos-demo-seed',
    cover_letter: 'Demo application created for recruiter AI scoring and shortlist testing.'
  };
  const result = existing
    ? await client.from('applications').update(payload).eq('id', existing.id).select('*').single()
    : await client.from('applications').insert(payload).select('*').single();
  if (result.error) throw new Error(`Failed to save application: ${result.error.message}`);
  return result.data;
}

async function scoreZikraApplicants(client: SupabaseClient, job: Record<string, any>, applications: Record<string, any>[], resumes: Record<string, any>[]) {
  const scoreResult = await callAiService<Record<string, any>>('/ai/candidates/score-batch', {
    job,
    applications,
    resumes
  });
  const rankings = Array.isArray(scoreResult.rankings) ? scoreResult.rankings : scoreResult.data?.rankings ?? [];
  const rows = rankings
    .map((ranking: Record<string, any>) => ({
      job_id: job.id,
      candidate_id: ranking.candidateId ?? ranking.candidate_id,
      resume_id: ranking.resumeId ?? ranking.resume_id,
      score: ranking.score ?? 0,
      matched_requirements: ranking.matchedRequirements ?? ranking.matched_requirements ?? [],
      missing_requirements: ranking.missingRequirements ?? ranking.missing_requirements ?? [],
      evidence: ranking.evidence ?? {},
      confidence: ranking.confidence ?? null,
      warnings: Array.isArray(ranking.warnings) ? ranking.warnings.map(String) : [],
      result: ranking
    }))
    .filter((row: Record<string, any>) => row.candidate_id);

  if (rows.length) {
    const { error } = await client.from('candidate_job_scores').insert(rows);
    if (error) throw new Error(`Failed to persist candidate scores: ${error.message}`);
  }
  return { scoreResult, rankings };
}

async function main() {
  await ensureBucket(supabase);

  const companyResults = [];
  const recruiterResults = [];
  const jobResults: Record<string, any>[] = [];

  for (const companySeed of companies) {
    const company = await ensureCompany(supabase, companySeed);
    const recruiter = await ensureRecruiter(supabase, company.id, companySeed);
    companyResults.push(company);
    recruiterResults.push({ ...recruiter, company: company.name });
    for (const jobSeed of companySeed.jobs) {
      jobResults.push(await ensureJob(supabase, company.id, jobSeed));
    }
  }

  const candidateResults = [];
  const applicationResults = [];
  const resumeRows = [];
  const zikraJob = jobResults.find((job) => job.title === 'AI Mobile App Engineer');
  if (!zikraJob) throw new Error('Zikra AI Mobile App Engineer job was not created');

  for (const candidateSeed of candidates) {
    const candidate = await ensureAuthUser(supabase, {
      email: candidateSeed.email,
      fullName: candidateSeed.fullName,
      role: 'candidate'
    });
    await supabase.from('candidate_profiles').upsert({ user_id: candidate.id, open_to_remote: true }, { onConflict: 'user_id' });
    const { resume, extractionConfidence } = await extractAndSaveResume(supabase, candidate, candidateSeed.fileName);
    const application = await ensureApplication(supabase, zikraJob.id, candidate.id, resume.id);
    candidateResults.push({ ...candidate, resumeId: resume.id, cv: candidateSeed.fileName, extractionConfidence });
    applicationResults.push(application);
    resumeRows.push(resume);
  }

  const { rankings } = await scoreZikraApplicants(supabase, zikraJob, applicationResults, resumeRows);
  const topCandidate = rankings[0] ?? null;

  console.log(JSON.stringify({
    companies: companyResults,
    jobsCreatedOrUpdated: jobResults.length,
    recruiters: recruiterResults.map((recruiter) => ({
      email: recruiter.email,
      password: PASSWORD,
      fullName: recruiter.fullName,
      company: recruiter.company
    })),
    candidates: candidateResults.map((candidate) => ({
      email: candidate.email,
      password: PASSWORD,
      fullName: candidate.fullName,
      resumeId: candidate.resumeId,
      cv: candidate.cv,
      extractionConfidence: candidate.extractionConfidence
    })),
    appliedJob: {
      id: zikraJob.id,
      title: zikraJob.title,
      company: 'Zikra Infortech'
    },
    applicationsCreatedOrUpdated: applicationResults.length,
    topCandidate
  }, null, 2));
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Recruiter AI demo seed failed: ${message}`);
  process.exitCode = 1;
});
