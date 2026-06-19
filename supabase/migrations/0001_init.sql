-- Navigator — initial schema (Day 1)
-- Run with the Supabase CLI (`supabase db reset`) or paste into the SQL editor.
-- RLS is enabled on all user/student data. Reference data (templates, questions,
-- careers, majors, organizations) is world-readable. Cross-student admin reads
-- are intentionally deferred (see docs/METHODOLOGY_ASSUMPTIONS.md → RLS TODO).

create extension if not exists pgcrypto;

-- updated_at helper -----------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- organizations ---------------------------------------------------------------
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text default 'school',
  region text,
  code text unique not null,
  created_at timestamptz default now()
);

-- profiles --------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  display_name text,
  grade_level int,
  preferred_language text default 'ru',
  school_code text,
  onboarding_completed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- organization_memberships ----------------------------------------------------
create table if not exists public.organization_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete cascade,
  role text check (role in ('student', 'teacher', 'admin', 'super_admin')),
  created_at timestamptz default now()
);

-- assessment_templates --------------------------------------------------------
create table if not exists public.assessment_templates (
  id uuid primary key default gen_random_uuid(),
  version text not null,
  title text not null,
  active boolean default false,
  created_at timestamptz default now()
);

-- assessment_questions --------------------------------------------------------
create table if not exists public.assessment_questions (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references public.assessment_templates(id) on delete cascade,
  item_code text not null,
  block text check (block in ('interests', 'competencies', 'values', 'strengths')),
  order_index int not null,
  prompt_key text not null,
  min_value int default 1,
  max_value int default 5,
  created_at timestamptz default now()
);

-- assessment_sessions ---------------------------------------------------------
create table if not exists public.assessment_sessions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  template_id uuid references public.assessment_templates(id),
  status text check (status in ('started', 'in_progress', 'submitted', 'abandoned')) default 'started',
  started_at timestamptz default now(),
  submitted_at timestamptz
);

-- assessment_answers ----------------------------------------------------------
create table if not exists public.assessment_answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.assessment_sessions(id) on delete cascade,
  question_id uuid references public.assessment_questions(id) on delete cascade,
  value int check (value between 1 and 5),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (session_id, question_id)
);

-- assessment_results ----------------------------------------------------------
create table if not exists public.assessment_results (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.assessment_sessions(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete cascade,
  template_version text not null,
  scoring_version text not null,
  ipo_raw_60 int,
  ipo_pct_100 int,
  awareness_level text check (awareness_level in ('low', 'medium', 'high')),
  primary_cluster text,
  secondary_cluster text,
  primary_route text,
  cluster_scores jsonb not null default '{}'::jsonb,
  block_scores jsonb not null default '{}'::jsonb,
  strengths jsonb not null default '[]'::jsonb,
  growth_areas jsonb not null default '[]'::jsonb,
  recommendations jsonb not null default '[]'::jsonb,
  result_json jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

-- careers ---------------------------------------------------------------------
create table if not exists public.careers (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title_key text not null,
  description_key text not null,
  route text not null,
  cluster_bias text[] default '{}',
  subject_tags text[] default '{}',
  goal_tags text[] default '{}',
  skill_tags text[] default '{}',
  market_relevance_score int default 50,
  is_demo_data boolean default true,
  created_at timestamptz default now()
);

-- majors ----------------------------------------------------------------------
create table if not exists public.majors (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title_key text not null,
  description_key text not null,
  route text not null,
  related_career_slugs text[] default '{}',
  created_at timestamptz default now()
);

-- plans -----------------------------------------------------------------------
create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  result_id uuid references public.assessment_results(id) on delete set null,
  horizon_months int check (horizon_months in (1, 2, 3, 6)),
  status text default 'active',
  title text,
  plan_json jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- plan_items ------------------------------------------------------------------
create table if not exists public.plan_items (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid references public.plans(id) on delete cascade,
  month_index int not null,
  week_index int,
  title text not null,
  description text,
  category text,
  status text check (status in ('todo', 'in_progress', 'done', 'skipped')) default 'todo',
  completion_percent int default 0,
  due_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- check_ins -------------------------------------------------------------------
create table if not exists public.check_ins (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  plan_id uuid references public.plans(id) on delete set null,
  mood_score int check (mood_score between 1 and 5),
  confidence_score int check (confidence_score between 1 and 5),
  effort_score int check (effort_score between 1 and 5),
  blocker text,
  note text,
  created_at timestamptz default now()
);

-- chat_threads ----------------------------------------------------------------
create table if not exists public.chat_threads (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  result_id uuid references public.assessment_results(id) on delete set null,
  title text,
  created_at timestamptz default now()
);

-- chat_messages ---------------------------------------------------------------
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid references public.chat_threads(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete cascade,
  role text check (role in ('user', 'assistant', 'system')),
  content text not null,
  moderation_json jsonb default '{}'::jsonb,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- exports ---------------------------------------------------------------------
create table if not exists public.exports (
  id uuid primary key default gen_random_uuid(),
  owner_profile_id uuid references public.profiles(id) on delete cascade,
  type text,
  storage_path text,
  status text default 'pending',
  created_at timestamptz default now()
);

-- analytics_events ------------------------------------------------------------
create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  event_name text not null,
  event_props jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- audit_logs ------------------------------------------------------------------
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_profile_id uuid references public.profiles(id) on delete set null,
  action text not null,
  target_type text,
  target_id text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- indexes ---------------------------------------------------------------------
create index if not exists idx_profiles_auth_user on public.profiles(auth_user_id);
create index if not exists idx_sessions_profile on public.assessment_sessions(profile_id);
create index if not exists idx_answers_session on public.assessment_answers(session_id);
create index if not exists idx_results_profile on public.assessment_results(profile_id);
create index if not exists idx_plans_profile on public.plans(profile_id);
create index if not exists idx_plan_items_plan on public.plan_items(plan_id);
create index if not exists idx_check_ins_profile on public.check_ins(profile_id);
create index if not exists idx_chat_threads_profile on public.chat_threads(profile_id);
create index if not exists idx_chat_messages_thread on public.chat_messages(thread_id);
create index if not exists idx_questions_template on public.assessment_questions(template_id);
create index if not exists idx_careers_route on public.careers(route);

-- updated_at triggers ---------------------------------------------------------
drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists trg_answers_updated on public.assessment_answers;
create trigger trg_answers_updated before update on public.assessment_answers
  for each row execute function public.set_updated_at();

drop trigger if exists trg_plans_updated on public.plans;
create trigger trg_plans_updated before update on public.plans
  for each row execute function public.set_updated_at();

drop trigger if exists trg_plan_items_updated on public.plan_items;
create trigger trg_plan_items_updated before update on public.plan_items
  for each row execute function public.set_updated_at();

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table public.organizations            enable row level security;
alter table public.profiles                 enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.assessment_templates     enable row level security;
alter table public.assessment_questions     enable row level security;
alter table public.assessment_sessions      enable row level security;
alter table public.assessment_answers       enable row level security;
alter table public.assessment_results       enable row level security;
alter table public.careers                  enable row level security;
alter table public.majors                   enable row level security;
alter table public.plans                    enable row level security;
alter table public.plan_items               enable row level security;
alter table public.check_ins                enable row level security;
alter table public.chat_threads             enable row level security;
alter table public.chat_messages            enable row level security;
alter table public.exports                  enable row level security;
alter table public.analytics_events         enable row level security;
alter table public.audit_logs               enable row level security;

-- Reference data: world-readable -------------------------------------------
create policy "read templates" on public.assessment_templates for select using (true);
create policy "read questions" on public.assessment_questions for select using (true);
create policy "read careers" on public.careers for select using (true);
create policy "read majors" on public.majors for select using (true);
create policy "read organizations" on public.organizations for select using (true);

-- profiles: owner only ------------------------------------------------------
create policy "own profile read" on public.profiles
  for select using (auth_user_id = auth.uid());
create policy "own profile insert" on public.profiles
  for insert with check (auth_user_id = auth.uid());
create policy "own profile update" on public.profiles
  for update using (auth_user_id = auth.uid()) with check (auth_user_id = auth.uid());

-- organization_memberships: read own memberships ----------------------------
create policy "own memberships read" on public.organization_memberships
  for select using (
    profile_id in (select id from public.profiles where auth_user_id = auth.uid())
  );

-- Student-owned data: full CRUD scoped to the owner -------------------------
create policy "own sessions" on public.assessment_sessions
  for all
  using (profile_id in (select id from public.profiles where auth_user_id = auth.uid()))
  with check (profile_id in (select id from public.profiles where auth_user_id = auth.uid()));

create policy "own answers" on public.assessment_answers
  for all
  using (
    session_id in (
      select s.id from public.assessment_sessions s
      join public.profiles p on p.id = s.profile_id
      where p.auth_user_id = auth.uid()
    )
  )
  with check (
    session_id in (
      select s.id from public.assessment_sessions s
      join public.profiles p on p.id = s.profile_id
      where p.auth_user_id = auth.uid()
    )
  );

create policy "own results" on public.assessment_results
  for all
  using (profile_id in (select id from public.profiles where auth_user_id = auth.uid()))
  with check (profile_id in (select id from public.profiles where auth_user_id = auth.uid()));

create policy "own plans" on public.plans
  for all
  using (profile_id in (select id from public.profiles where auth_user_id = auth.uid()))
  with check (profile_id in (select id from public.profiles where auth_user_id = auth.uid()));

create policy "own plan items" on public.plan_items
  for all
  using (
    plan_id in (
      select pl.id from public.plans pl
      join public.profiles p on p.id = pl.profile_id
      where p.auth_user_id = auth.uid()
    )
  )
  with check (
    plan_id in (
      select pl.id from public.plans pl
      join public.profiles p on p.id = pl.profile_id
      where p.auth_user_id = auth.uid()
    )
  );

create policy "own check_ins" on public.check_ins
  for all
  using (profile_id in (select id from public.profiles where auth_user_id = auth.uid()))
  with check (profile_id in (select id from public.profiles where auth_user_id = auth.uid()));

create policy "own chat threads" on public.chat_threads
  for all
  using (profile_id in (select id from public.profiles where auth_user_id = auth.uid()))
  with check (profile_id in (select id from public.profiles where auth_user_id = auth.uid()));

create policy "own chat messages" on public.chat_messages
  for all
  using (profile_id in (select id from public.profiles where auth_user_id = auth.uid()))
  with check (profile_id in (select id from public.profiles where auth_user_id = auth.uid()));

create policy "own exports" on public.exports
  for all
  using (owner_profile_id in (select id from public.profiles where auth_user_id = auth.uid()))
  with check (owner_profile_id in (select id from public.profiles where auth_user_id = auth.uid()));

-- analytics: insert allowed, read your own -----------------------------------
create policy "insert analytics" on public.analytics_events for insert with check (true);
create policy "read own analytics" on public.analytics_events
  for select using (profile_id in (select id from public.profiles where auth_user_id = auth.uid()));

-- audit_logs: no client policies — service_role only (bypasses RLS).

-- TODO (Day 2+): admin/teacher cross-student reads scoped to a shared
-- organization. Requires a SECURITY DEFINER helper (e.g. is_org_admin(org_id))
-- to avoid recursive RLS on organization_memberships. Deliberately omitted on
-- Day 1 so no policy accidentally over-exposes student data.
