# HireOS Backend

Node.js/TypeScript API for HireOS product CRUD, authentication, Supabase access, and AI-Service orchestration.

## Responsibilities

- Own all Supabase database and storage CRUD.
- Authenticate users and issue backend JWT access tokens.
- Rotate backend refresh tokens stored in Supabase.
- Enforce candidate, recruiter, and admin route boundaries.
- Call `AI-Service` only from backend routes.
- Validate requests with Zod before controller/service logic.

## Setup

1. Copy `.env.example` to `.env`.
2. Fill in Supabase and JWT values.
3. Install dependencies:

```bash
npm install
```

4. Apply the Supabase migration after linking/configuring Supabase:

```bash
npm run supabase:migrate
```

5. Run the API:

```bash
npm run dev
```

## Main API Prefix

```text
/api/v1
```

## Product User Architecture

HireOS has two main product users:

- `candidate`: normal user/job seeker. Can browse open jobs, apply, save jobs, manage their profile, manage resumes, and use candidate AI tools.
- `recruiter`: job poster/company user. Can manage company jobs, view applicants for their company jobs, update application pipeline status, and use recruiter AI tools.

The backend exposes product routes around those two roles instead of relying only on raw table CRUD.

```text
public marketplace
  GET /api/v1/jobs
  GET /api/v1/jobs/:jobId

candidate workspace
  /api/v1/candidate/*

recruiter workspace
  /api/v1/recruiter/*

AI orchestration
  /api/v1/ai/*
```

## Auth Endpoints

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`

## Domain CRUD Endpoints

CRUD route pattern:

```text
GET    /api/v1/{resource}
GET    /api/v1/{resource}/:id
POST   /api/v1/{resource}
PATCH  /api/v1/{resource}/:id
DELETE /api/v1/{resource}/:id
```

Resources include:

- `users`
- `companies`
- `company-members`
- `candidate-profiles`
- `recruiter-profiles`
- `jobs`
- `applications`
- `documents`
- `document-extractions`
- `resumes`
- `resume-versions`
- `resume-scores`
- `candidate-job-scores`
- `candidate-job-matches`
- `interview-questions`
- `mock-interviews`
- `mock-interview-messages`
- `mock-interview-evaluations`
- `conversations`
- `conversation-messages`
- `saved-jobs`
- `notifications`
- `skills`

These generic CRUD routes are infrastructure-level and require the `admin` role. Product UI should prefer the role-aware routes below for jobs, applicants, applications, and profiles.

## Marketplace Job Routes

Public/open job browsing:

- `GET /api/v1/jobs`
- `GET /api/v1/jobs/:jobId`

Candidate actions:

- `POST /api/v1/jobs/:jobId/apply`
- `POST /api/v1/jobs/:jobId/save`

Supported job search filters:

- `q`
- `location`
- `remoteType`
- `employmentType`
- `seniority`
- `minSalary`
- `skill`
- `page`
- `limit`

## Candidate Routes

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

Candidate routes require `candidate` or `admin` role.

## Recruiter Routes

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

Recruiter routes require `recruiter` or `admin` role. Recruiters can only operate on companies contained in their JWT `companyIds`.

## AI Orchestration Endpoints

These routes call `AI-Service` and persist results in Supabase where appropriate:

- `POST /api/v1/ai/resumes/extract`
- `POST /api/v1/ai/resumes/analyze`
- `POST /api/v1/ai/jobs/match`
- `POST /api/v1/ai/candidates/score`
- `POST /api/v1/ai/interviews/generate`
- `POST /api/v1/ai/interviews/mock/evaluate`
- `POST /api/v1/ai/recruiter/chat`
- `POST /api/v1/ai/candidate/chat`
- `GET /api/v1/ai/tasks/:taskId`
