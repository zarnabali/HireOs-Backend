import { env } from '../config/env';
import { supabaseAdmin } from '../config/supabase';

type CheckStatus = 'ok' | 'degraded' | 'fail' | 'skipped';

interface DiagnosticCheck {
  name: string;
  service: 'backend' | 'supabase' | 'ai-service';
  status: CheckStatus;
  latencyMs: number;
  message: string;
  details?: Record<string, unknown>;
}

interface ProbeOptions {
  deep: boolean;
}

const REQUEST_TIMEOUT_MS = 45_000;

const diagnosticsPdfBase64 = Buffer.from(`%PDF-1.1
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Length 235 >>
stream
BT /F1 12 Tf 72 720 Td (Diagnostics Candidate) Tj 0 -18 Td (Email: diagnostics@example.com) Tj 0 -18 Td (Skills: Python, FastAPI, Docker, AWS, Supabase) Tj 0 -18 Td (Experience: Backend Engineer at Diagnostics Labs) Tj 0 -18 Td (Education: BS Computer Science) Tj ET
endstream
endobj
trailer
<< /Root 1 0 R >>
%%EOF`).toString('base64');

const sampleStructuredResume = {
  contact: {
    full_name: 'Diagnostics Candidate',
    email: 'diagnostics@example.com',
    location: 'Remote'
  },
  summary: 'Backend engineer with FastAPI, Node.js, Supabase, Docker, and AWS experience.',
  skills: ['Python', 'FastAPI', 'Node.js', 'TypeScript', 'Supabase', 'Docker', 'AWS'],
  experience: [
    {
      company: 'Diagnostics Labs',
      title: 'Backend Engineer',
      start_date: '2023',
      end_date: 'Present',
      achievements: ['Improved API response time by 35%', 'Built queue-backed document workflows']
    }
  ],
  education: [{ institution: 'Diagnostics University', degree: 'BS Computer Science' }],
  projects: [{ name: 'Hiring Agent', technologies: ['FastAPI', 'OpenAI', 'Supabase'] }]
};

const sampleJob = {
  id: 'diagnostics-job',
  title: 'Backend Engineer',
  description: 'Build APIs, document extraction workflows, and AI hiring tools.',
  required_skills: ['Python', 'FastAPI', 'Docker', 'AWS', 'Supabase'],
  companies: { name: 'Diagnostics Company' },
  status: 'open'
};

export class SystemDiagnosticsService {
  static async getStatus(options: ProbeOptions) {
    const startedAt = Date.now();
    const checks = await this.runChecks(options);
    const summary = this.summarize(checks);

    return {
      status: summary.status,
      checkedAt: new Date().toISOString(),
      architecture: {
        frontend: 'deployed separately; frontend calls backend only',
        backend: 'this Node.js API service',
        aiService: env.AI_SERVICE_URL,
        database: 'Supabase, accessed by backend'
      },
      summary,
      checks,
      durationMs: Date.now() - startedAt
    };
  }

  private static async runChecks(options: ProbeOptions): Promise<DiagnosticCheck[]> {
    const baseChecks = await Promise.all([
      this.checkBackendRuntime(),
      this.checkSupabaseDatabase(),
      this.checkSupabaseStorage(),
      this.checkAiServiceHealth()
    ]);

    if (!options.deep) {
      return [
        ...baseChecks,
        {
          name: 'ai-feature-smoke-tests',
          service: 'ai-service',
          status: 'skipped',
          latencyMs: 0,
          message: 'Add ?deep=true with x-diagnostics-key to run AI feature smoke tests.'
        }
      ];
    }

    const aiFeatureChecks = await Promise.all([
      this.checkAiEndpoint('resume-analyzer', '/ai/resumes/analyze', {
        structuredResume: sampleStructuredResume,
        targetRole: 'Backend Engineer',
        targetJobDescription: sampleJob.description
      }),
      this.checkAiEndpoint('job-matcher', '/ai/jobs/match', {
        candidateId: 'diagnostics-candidate',
        resumeId: 'diagnostics-resume',
        structuredResume: sampleStructuredResume,
        jobs: [sampleJob],
        limit: 5
      }),
      this.checkAiEndpoint('candidate-scorer', '/ai/candidates/score-batch', {
        job: sampleJob,
        applications: [{ id: 'diagnostics-application', candidateId: 'diagnostics-candidate', resumeId: 'diagnostics-resume' }],
        resumes: [{ id: 'diagnostics-resume', candidateId: 'diagnostics-candidate', structuredData: sampleStructuredResume }]
      }),
      this.checkAiEndpoint('interview-generator', '/ai/interviews/generate', {
        candidateId: 'diagnostics-candidate',
        resumeId: 'diagnostics-resume',
        jobId: 'diagnostics-job',
        structuredResume: sampleStructuredResume,
        job: sampleJob,
        focusAreas: ['FastAPI', 'Docker'],
        difficulty: 'medium',
        questionCount: 3
      }),
      this.checkAiEndpoint('mock-interview-evaluator', '/ai/interviews/mock/evaluate', {
        interviewSessionId: 'diagnostics-session',
        questionId: 'diagnostics-question',
        question: 'How would you design a reliable resume extraction API?',
        answer: 'I would separate upload, extraction, validation, and persistence. The API should validate file type, call an extraction service, store structured fields, and surface low-confidence results for review.'
      }),
      this.checkAiEndpoint('hiring-assistant', '/ai/recruiter/chat', {
        recruiterId: 'diagnostics-recruiter',
        message: 'Show me backend candidates with FastAPI and Docker.',
        context: {
          recruiterContext: {
            recruiter: { fullName: 'Diagnostics Recruiter' },
            companies: [{ name: 'Diagnostics Company' }],
            jobs: [sampleJob],
            applicants: []
          }
        }
      }),
      this.checkAiEndpoint('career-assistant', '/ai/candidate/chat', {
        candidateId: 'diagnostics-candidate',
        message: 'How can I improve for backend engineer roles?',
        context: {},
        candidateContext: {
          profile: { headline: 'Backend Engineer', desired_role: 'Backend Engineer' },
          primaryResume: { id: 'diagnostics-resume', structuredData: sampleStructuredResume },
          availableJobs: [{ id: sampleJob.id, title: sampleJob.title, company: 'Diagnostics Company', requiredSkills: sampleJob.required_skills }]
        }
      }),
      this.checkAiEndpoint('resume-extractor', '/ai/resumes/extract', {
        documentId: 'diagnostics-document',
        candidateId: 'diagnostics-candidate',
        fileName: 'diagnostics-resume.pdf',
        sourceMimeType: 'application/pdf',
        fileContentBase64: diagnosticsPdfBase64,
        options: { forceReprocess: true, includeRawSections: false }
      })
    ]);

    return [...baseChecks, ...aiFeatureChecks];
  }

  private static async checkBackendRuntime(): Promise<DiagnosticCheck> {
    const startedAt = Date.now();
    return {
      name: 'backend-runtime',
      service: 'backend',
      status: 'ok',
      latencyMs: Date.now() - startedAt,
      message: 'Backend process is running.',
      details: {
        nodeEnv: env.NODE_ENV,
        apiVersion: env.API_VERSION,
        hasFrontendOrigin: Boolean(env.FRONTEND_ORIGIN),
        hasAiServiceUrl: Boolean(env.AI_SERVICE_URL)
      }
    };
  }

  private static async checkSupabaseDatabase(): Promise<DiagnosticCheck> {
    return this.timed('supabase-database', 'supabase', async () => {
      const { error, count } = await supabaseAdmin.from('users').select('id', { count: 'exact', head: true });
      if (error) {
        return { status: 'fail' as const, message: 'Supabase database query failed.', details: { error: error.message } };
      }
      return { status: 'ok' as const, message: 'Supabase database is reachable.', details: { usersTableReachable: true, countKnown: typeof count === 'number' } };
    });
  }

  private static async checkSupabaseStorage(): Promise<DiagnosticCheck> {
    return this.timed('supabase-storage', 'supabase', async () => {
      const { data, error } = await supabaseAdmin.storage.getBucket(env.SUPABASE_STORAGE_BUCKET);
      if (error) {
        return {
          status: 'fail' as const,
          message: `Supabase storage bucket "${env.SUPABASE_STORAGE_BUCKET}" is not reachable.`,
          details: { error: error.message, bucket: env.SUPABASE_STORAGE_BUCKET }
        };
      }
      return { status: 'ok' as const, message: 'Supabase storage bucket is reachable.', details: { bucket: data.name } };
    });
  }

  private static async checkAiServiceHealth(): Promise<DiagnosticCheck> {
    return this.checkAiEndpoint('ai-service-health', '/health', undefined, { method: 'GET' });
  }

  private static async checkAiEndpoint(
    name: string,
    path: string,
    body?: unknown,
    options: { method?: 'GET' | 'POST'; expectStatus?: number } = {}
  ): Promise<DiagnosticCheck> {
    const startedAt = Date.now();
    const method = options.method ?? 'POST';

    try {
      const init: RequestInit = {
        method,
        headers: {
          ...(body === undefined ? {} : { 'content-type': 'application/json' }),
          'x-api-key': env.AI_SERVICE_API_KEY
        }
      };
      if (body !== undefined) {
        init.body = JSON.stringify(body);
      }

      const response = await this.fetchWithTimeout(`${env.AI_SERVICE_URL}${path}`, init);
      const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;
      const expectedStatus = options.expectStatus ?? 200;
      const expected = response.status === expectedStatus;
      const applicationSuccess = payload?.success !== false;
      const status = expected && (expectedStatus >= 400 || applicationSuccess) ? 'ok' : 'fail';

      return {
        name,
        service: 'ai-service',
        status,
        latencyMs: Date.now() - startedAt,
        message: status === 'ok' ? `${name} responded as expected.` : `${name} returned an unexpected response.`,
        details: {
          method,
          path,
          httpStatus: response.status,
          expectedStatus,
          success: payload?.success,
          hasError: Boolean(payload?.error ?? payload?.detail)
        }
      };
    } catch (error) {
      return {
        name,
        service: 'ai-service',
        status: 'fail',
        latencyMs: Date.now() - startedAt,
        message: `${name} is not reachable.`,
        details: { error: error instanceof Error ? error.message : String(error), path }
      };
    }
  }

  private static async timed(
    name: string,
    service: DiagnosticCheck['service'],
    check: () => Promise<Omit<DiagnosticCheck, 'name' | 'service' | 'latencyMs'>>
  ): Promise<DiagnosticCheck> {
    const startedAt = Date.now();
    try {
      const result = await check();
      return { name, service, latencyMs: Date.now() - startedAt, ...result };
    } catch (error) {
      return {
        name,
        service,
        status: 'fail',
        latencyMs: Date.now() - startedAt,
        message: `${name} check failed.`,
        details: { error: error instanceof Error ? error.message : String(error) }
      };
    }
  }

  private static summarize(checks: DiagnosticCheck[]) {
    const fail = checks.filter((check) => check.status === 'fail').length;
    const degraded = checks.filter((check) => check.status === 'degraded').length;
    const skipped = checks.filter((check) => check.status === 'skipped').length;
    const ok = checks.filter((check) => check.status === 'ok').length;
    const status: Exclude<CheckStatus, 'skipped'> = fail > 0 ? 'fail' : degraded > 0 ? 'degraded' : 'ok';

    return {
      status,
      ok,
      degraded,
      fail,
      skipped,
      total: checks.length
    };
  }

  private static async fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      return await fetch(url, { ...init, signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }
  }
}
