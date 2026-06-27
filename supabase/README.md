# Supabase setup for Aurora Freight / A-TMS

This stores **sensitive survey data** (email, phone, fleet info) and a **log of confirmation emails** sent after someone completes the 10-step lead survey.

## What gets stored

| Table | Purpose |
|-------|---------|
| `survey_leads` | 10-step survey answers + email/phone (PII) |
| `email_responses` | Confirmation / AI email send log |
| `profiles` | Dashboard users (login/signup) — linked to **Supabase Auth** |
| `auth.users` | Managed by Supabase Auth (email + password) |

Login and signup use **Supabase Auth** — not the old browser localStorage demo. Each signup creates a row in `auth.users` and `profiles`.

## Enable email login in Supabase

1. **Authentication** → **Providers** → **Email** → enable
2. For development, you can disable “Confirm email” under **Authentication** → **Settings** so sign-up works instantly

The app **also** saves leads to your FastAPI backend (SQLite) and sends email via **Resend** when configured. Supabase is the cloud copy for production.

## Step 1 — Create a Supabase project

1. Go to [https://supabase.com](https://supabase.com) and sign in.
2. **New project** → pick a name (e.g. `aurora-freight`), region, database password.
3. Wait for the project to finish provisioning (~2 min).

## Step 2 — Run the database schema

1. In Supabase: **SQL Editor** → **New query**.
2. Copy the entire contents of [`schema.sql`](./schema.sql) in this folder.
3. Click **Run**.

You should see success with tables `survey_leads` and `email_responses`.

## Step 3 — Get your API keys

1. **Project Settings** (gear) → **API**.
2. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Do **not** put the `service_role` key in the frontend — that bypasses Row Level Security.

## Step 4 — Add keys to the frontend

Edit `frontend/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Restart the dev server:

```bash
cd frontend
npm run dev
```

## Step 5 — Test a submission

1. Open http://localhost:3000
2. Complete the survey popup (or use **Survey** in the nav).
3. In Supabase: **Table Editor** → `survey_leads` → you should see a new row.
4. If the backend + Resend are configured, check `email_responses` for the send log.

## Row Level Security (already in schema)

- **Anonymous visitors** can **insert** into both tables (for the public website).
- **Read** is not enabled for anon — only you (dashboard / service role) can view responses.

To view leads in Supabase Table Editor, use your project dashboard (bypasses RLS as admin).

## Optional — view leads in Supabase only

If the backend is offline, survey answers still save to Supabase when keys are set. Confirmation email requires the backend (`RESEND_API_KEY` in `backend/.env`).

## Files in the repo

| File | Role |
|------|------|
| `supabase/schema.sql` | Tables + RLS policies |
| `frontend/src/lib/supabase/client.ts` | Supabase client |
| `frontend/src/lib/survey-submit.ts` | Saves to Supabase + backend + email log |
