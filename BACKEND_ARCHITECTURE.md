# HireOS Backend Architecture

This backend is the product API boundary for HireOS. It owns authentication, authorization, Supabase CRUD, storage metadata, marketplace workflows, and calls to `AI-Service`.

## User Types

HireOS has two primary user roles:

- `candidate`: normal user / job seeker.
- `recruiter`: company user / job poster.

The backend must keep these workflows separate. Candidates must never use recruiter routes, and recruiters must only access jobs/applicants connected to their companies.

## Backend Responsibilities

- Authenticate users with Supabase Auth.
- Issue backend JWT access tokens.
- Rotate backend refresh tokens stored in `refresh_tokens`.
- Own Supabase database and storage access.
- Expose role-aware product APIs to the frontend.
- Call `AI-Service` for AI features only through `clients/aiService.client.ts`.
- Validate every request with Zod.
- Keep generic CRUD admin-only.

## Route Architecture

```text
/api/v1/auth/*
  login, register, refresh, logout, me

/api/v1/jobs/*
  public open job marketplace
  candidate apply/save actions

/api/v1/candidate/*
  candidate profile
  candidate resumes
  candidate applications
  candidate saved jobs

/api/v1/recruiter/*
  recruiter profile
  recruiter companies
  recruiter job posting
  recruiter applicant pipeline

/api/v1/ai/*
  backend-owned AI orchestration

/api/v1/{admin-crud-resource}
  admin-only infrastructure CRUD
```

## Candidate Flow

```text
candidate registers/logs in
  -> manages profile
  -> creates/uploads resume metadata
  -> browses open jobs
  -> saves jobs
  -> applies to jobs with selected resume
  -> tracks applications
  -> uses candidate AI routes for resume analysis, job matching, mock interview, career chat
```

Candidate route examples:

- `GET /api/v1/jobs`
- `GET /api/v1/jobs/:jobId`
- `POST /api/v1/jobs/:jobId/apply`
- `POST /api/v1/jobs/:jobId/save`
- `GET /api/v1/candidate/profile`
- `PATCH /api/v1/candidate/profile`
- `GET /api/v1/candidate/resumes`
- `POST /api/v1/candidate/resumes`
- `GET /api/v1/candidate/resumes/:resumeId`
- `PATCH /api/v1/candidate/resumes/:resumeId`
- `DELETE /api/v1/candidate/resumes/:resumeId`
- `POST /api/v1/candidate/resumes/:resumeId/set-primary`
- `GET /api/v1/candidate/applications`
- `PATCH /api/v1/candidate/applications/:applicationId`
- `POST /api/v1/candidate/applications/:applicationId/withdraw`
- `GET /api/v1/candidate/saved-jobs`
- `DELETE /api/v1/candidate/saved-jobs/:jobId`

## Recruiter Flow

```text
recruiter registers/logs in
  -> company is created and recruiter becomes company owner
  -> recruiter creates draft jobs
  -> recruiter publishes jobs
  -> candidates apply
  -> recruiter reviews applicants for company-scoped jobs
  -> recruiter updates applicant status
  -> recruiter uses AI routes for scoring, shortlist, interview kits, and hiring assistant chat
```

Recruiter route examples:

- `GET /api/v1/recruiter/profile`
- `PATCH /api/v1/recruiter/profile`
- `GET /api/v1/recruiter/companies`
- `PATCH /api/v1/recruiter/companies/:companyId`
- `GET /api/v1/recruiter/jobs`
- `POST /api/v1/recruiter/jobs`
- `PATCH /api/v1/recruiter/jobs/:jobId`
- `POST /api/v1/recruiter/jobs/:jobId/publish`
- `POST /api/v1/recruiter/jobs/:jobId/pause`
- `POST /api/v1/recruiter/jobs/:jobId/close`
- `DELETE /api/v1/recruiter/jobs/:jobId`
- `GET /api/v1/recruiter/jobs/:jobId/applicants`
- `PATCH /api/v1/recruiter/applications/:applicationId`

## AI-Service Integration

The backend calls AI-Service from:

```text
src/clients/aiService.client.ts
src/services/ai-orchestration.service.ts
```

AI routes:

- `POST /api/v1/ai/resumes/extract`
- `POST /api/v1/ai/resumes/analyze`
- `POST /api/v1/ai/jobs/match`
- `POST /api/v1/ai/candidates/score`
- `POST /api/v1/ai/interviews/generate`
- `POST /api/v1/ai/interviews/mock/evaluate`
- `POST /api/v1/ai/recruiter/chat`
- `POST /api/v1/ai/candidate/chat`
- `GET /api/v1/ai/tasks/:taskId`

AI-Service returns structured JSON. Backend validates and persists the product result.

## Security Rules

- Frontend never receives Supabase service-role key.
- Generic CRUD routes require `admin`.
- Candidate routes require `candidate` or `admin`.
- Recruiter routes require `recruiter` or `admin`.
- Recruiter job/applicant access is scoped by JWT `companyIds`.
- Candidate resume/application/saved-job access is scoped by `req.user.id`.
- Supabase public tables have RLS enabled in migrations.

## Database Coverage

Core tables:

- `users`
- `refresh_tokens`
- `companies`
- `company_members`
- `candidate_profiles`
- `recruiter_profiles`
- `jobs`
- `applications`
- `documents`
- `document_extractions`
- `resumes`
- `resume_versions`
- `resume_scores`
- `candidate_job_scores`
- `candidate_job_matches`
- `saved_jobs`
- `interview_questions`
- `mock_interviews`
- `mock_interview_messages`
- `mock_interview_evaluations`
- `conversations`
- `conversation_messages`
- `notifications`
- `skills`
- `audit_logs`

## Implementation Checklist

- Auth and refresh tokens: implemented.
- Candidate/job seeker routes: implemented.
- Recruiter/job poster routes: implemented.
- Public job marketplace routes: implemented.
- Company-scoped recruiter access: implemented.
- Candidate-owned resumes/applications/saved jobs: implemented.
- Admin-only infrastructure CRUD: implemented.
- AI-Service client and orchestration routes: implemented.
- Supabase migrations: created, not yet pushed to live Supabase.
- Runtime verification: typecheck, build, tests, audit.

## Remaining Live Setup

The backend code is ready, but live setup still needs:

- Real backend `.env` values.
- Supabase CLI installed or MCP access configured.
- Migrations pushed to the Supabase project.
- Storage bucket policies for actual resume file uploads.
- AI-Service running at `AI_SERVICE_URL`.
