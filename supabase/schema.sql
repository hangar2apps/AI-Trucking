-- Run in Supabase SQL Editor (Dashboard → SQL → New query)
-- Part 1: Survey / lead capture (PII)
-- Part 2: User profiles (linked to Supabase Auth)

create extension if not exists "pgcrypto";

-- ─── Survey leads (10-step popup / /survey pages) ───────────────────────────

create table if not exists public.survey_leads (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  phone text,
  company_size text not null,
  industry text not null,
  fleet_size text not null,
  features jsonb not null default '[]'::jsonb,
  pain_point text not null,
  current_tools text,
  timeline text not null,
  role text not null,
  consent boolean not null default false,
  source text not null default 'landing_popup',
  created_at timestamptz not null default now()
);

create index if not exists survey_leads_email_idx on public.survey_leads (email);
create index if not exists survey_leads_created_at_idx on public.survey_leads (created_at desc);

create table if not exists public.email_responses (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.survey_leads (id) on delete set null,
  user_id uuid references auth.users (id) on delete set null,
  to_email text not null,
  subject text not null,
  body_html text,
  email_type text not null default 'survey_confirmation',
  sent boolean not null default false,
  provider_message text,
  created_at timestamptz not null default now()
);

create index if not exists email_responses_lead_id_idx on public.email_responses (lead_id);
create index if not exists email_responses_user_id_idx on public.email_responses (user_id);

-- ─── App users (login / signup via Supabase Auth) ─────────────────────────

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  company_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Row Level Security ───────────────────────────────────────────────────

alter table public.survey_leads enable row level security;
alter table public.email_responses enable row level security;
alter table public.profiles enable row level security;

drop policy if exists "anon_insert_survey_leads" on public.survey_leads;
create policy "anon_insert_survey_leads"
  on public.survey_leads for insert to anon, authenticated
  with check (true);

drop policy if exists "anon_insert_email_responses" on public.email_responses;
create policy "anon_insert_email_responses"
  on public.email_responses for insert to anon, authenticated
  with check (true);

drop policy if exists "users_read_own_profile" on public.profiles;
create policy "users_read_own_profile"
  on public.profiles for select to authenticated
  using (auth.uid() = id);

drop policy if exists "users_update_own_profile" on public.profiles;
create policy "users_update_own_profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id);

comment on table public.survey_leads is '10-step lead survey responses (PII)';
comment on table public.email_responses is 'Email send log (survey + AI customer emails)';
comment on table public.profiles is 'Dashboard users — one row per auth.users signup';
