# Supabase Setup and Migration Runbook

Use this file to configure backend `.env` values and push database migrations from commands instead of the Supabase SQL editor.

## 1. Get Backend Environment Values

Open your Supabase project dashboard.

### `SUPABASE_URL`

Go to:

```text
Project Dashboard -> Project Settings -> API
```

Copy the Project URL. It looks like:

```text
https://xxxxxxxxxxxxxxxxxxxx.supabase.co
```

Set:

```env
SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
```

### `SUPABASE_ANON_KEY`

For the current Supabase key system, prefer the publishable key when possible:

```env
SUPABASE_ANON_KEY=sb_publishable_xxx
```

If your project still uses legacy keys, use:

```env
SUPABASE_ANON_KEY=legacy anon public key
```

This is low-privilege and can be used by clients, but in this project the frontend should still call backend APIs only.

### `SUPABASE_SERVICE_ROLE_KEY`

For the current Supabase key system, prefer a secret key:

```env
SUPABASE_SERVICE_ROLE_KEY=sb_secret_xxx
```

If your project still uses legacy keys, use:

```env
SUPABASE_SERVICE_ROLE_KEY=legacy service_role key
```

Important:

- Keep this key only in `backend/.env`.
- Never put it in frontend `.env`.
- Never expose it in browser code.
- Never commit `.env`.

### `SUPABASE_STORAGE_BUCKET`

This is the bucket name for resumes. Keep:

```env
SUPABASE_STORAGE_BUCKET=resumes
```

Create a private Supabase Storage bucket named `resumes` later when file upload is implemented.

## 2. Generate JWT Secret

Use any secure random 32+ character value.

PowerShell:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Set:

```env
JWT_SECRET=generated-value-here
```

## 3. AI Service Values

For local development:

```env
AI_SERVICE_URL=http://localhost:8000
AI_SERVICE_API_KEY=local-dev-ai-service-key
```

`AI_SERVICE_API_KEY` is an internal shared secret between backend and AI-Service. You can choose a random value now, then configure the same value in `AI-Service/.env` when that service is implemented.

## 4. Install Supabase CLI Locally

From `backend/`:

```powershell
npm install
```

The backend includes `supabase` as a dev dependency, so commands run through `npx supabase`.

Check it:

```powershell
npm run supabase:help
```

## 5. Login to Supabase

From `backend/`:

```powershell
npm run supabase:login
```

This opens a browser or asks for an access token.

If it asks for a token manually:

```text
Supabase Dashboard -> Account/Access Tokens -> Generate token
```

Paste that token into the CLI prompt.

## 6. Link This Backend to Your Supabase Project

Get your project ref from the dashboard URL:

```text
https://supabase.com/dashboard/project/<project-ref>
```

Then from `backend/` run:

```powershell
npx supabase link --project-ref <project-ref>
```

You can also use the script:

```powershell
npm run supabase:link -- --project-ref <project-ref>
```

## 7. Push Migrations from Command

The migration files are in:

```text
backend/supabase/migrations/
```

Push them to the linked Supabase project:

```powershell
npm run supabase:migrate
```

Dry run first:

```powershell
npm run supabase:migrate:dry
```

Check migration status:

```powershell
npm run supabase:migrations
```

## 8. Create a New Migration Later

Use:

```powershell
npm run supabase:new -- migration_name_here
```

Then edit the generated SQL file in:

```text
backend/supabase/migrations/
```

Push it:

```powershell
npm run supabase:migrate
```

## 9. Recommended Order

1. Create Supabase project.
2. Copy keys into `backend/.env`.
3. Run `npm install`.
4. Run `npm run supabase:login`.
5. Run `npm run supabase:link -- --project-ref <project-ref>`.
6. Run `npm run supabase:migrate`.
7. Run `npm run typecheck`.
8. Run `npm test`.
9. Run `npm run dev`.

## 10. Common Problems

### `supabase is not recognized`

Use the npm scripts. They call `npx supabase`.

```powershell
npm run supabase:help
```

### `Project ref required`

Run:

```powershell
npm run supabase:link -- --project-ref <project-ref>
```

### Migration fails because extension `vector` is not available

Enable the `vector` extension in Supabase, or run the migration again after confirming your Supabase project supports pgvector.

### Migration times out connecting to `db.<project-ref>.supabase.co`

Your network may not support direct IPv6 database connections. Use the Supabase pooler connection string instead:

```text
Supabase Dashboard -> Project -> Connect -> Connection string -> Pooler
```

Add it to `backend/.env`:

```env
SUPABASE_POOLER_CONNECTION_STRING=postgresql://...
```

The backend migration script prefers `SUPABASE_POOLER_CONNECTION_STRING` and falls back to `SUPABASE_CONNECTION_STRING`.

### Backend starts but cannot connect to Supabase

Check:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- no quotes around values in `.env`
- no trailing spaces
