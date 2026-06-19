-- Navigator — Day 2: onboarding profile fields.
-- Adds the richer onboarding data captured by the wizard. `grade_level` stays
-- int (8–11); the "other" choice is stored as null grade + onboarding_json.grade_choice.

alter table public.profiles
  add column if not exists favorite_subjects text[] not null default '{}',
  add column if not exists current_goals text[] not null default '{}',
  add column if not exists career_confidence int,
  add column if not exists support_preference text,
  add column if not exists free_text_goal text,
  add column if not exists onboarding_json jsonb not null default '{}'::jsonb;

-- Validate small enumerations without blocking existing rows.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_career_confidence_range'
  ) then
    alter table public.profiles
      add constraint profiles_career_confidence_range
      check (career_confidence is null or (career_confidence between 1 and 5));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'profiles_support_preference_check'
  ) then
    alter table public.profiles
      add constraint profiles_support_preference_check
      check (
        support_preference is null
        or support_preference in ('simple_guidance', 'detailed_guidance', 'ai_counselor')
      );
  end if;
end $$;
