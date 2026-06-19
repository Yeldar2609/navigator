-- Navigator — seed data (Day 1)
-- Idempotent: safe to run multiple times. Run after 0001_init.sql.
--
-- "Five routes" (technological, research, managerial, social_humanitarian,
-- creative) are app-level config (lib/methodology/routes.ts), not a table. They
-- appear here as the `route` column on careers/majors. No routes table by design.

-- Demo organization -----------------------------------------------------------
insert into public.organizations (name, type, region, code)
values ('Demo School', 'school', 'Almaty', 'DEMO-SCHOOL')
on conflict (code) do nothing;

-- Active assessment template v1 -----------------------------------------------
insert into public.assessment_templates (id, version, title, active)
values ('11111111-1111-1111-1111-111111111111', 'v1', 'Navigator of Self-Determination v1', true)
on conflict (id) do nothing;

-- 40 questions (Q1–Q40), 4 blocks of 10. prompt_key resolves to localized text
-- in lib/methodology/assessment-items.ts (ITEM_PROMPTS).
insert into public.assessment_questions (template_id, item_code, block, order_index, prompt_key)
select
  '11111111-1111-1111-1111-111111111111'::uuid,
  'Q' || g,
  case
    when g <= 10 then 'interests'
    when g <= 20 then 'competencies'
    when g <= 30 then 'values'
    else 'strengths'
  end,
  g,
  'assessment.items.Q' || g
from generate_series(1, 40) as g
where not exists (
  select 1 from public.assessment_questions q
  where q.template_id = '11111111-1111-1111-1111-111111111111'::uuid
    and q.item_code = 'Q' || g
);

-- 25 starter careers (curated demo data, NOT live labor-market data) ----------
insert into public.careers
  (slug, title_key, description_key, route, cluster_bias, subject_tags, goal_tags, skill_tags, market_relevance_score, is_demo_data)
values
  -- technological
  ('software_developer','careers.software_developer.title','careers.software_developer.description','technological', array['digital_innovator'], array['informatics','math'], array['build_products','high_income'], array['coding','problem_solving'], 95, true),
  ('data_analyst','careers.data_analyst.title','careers.data_analyst.description','technological', array['digital_innovator','researcher'], array['math','informatics'], array['high_income','solve_problems'], array['analysis','statistics'], 90, true),
  ('ai_specialist','careers.ai_specialist.title','careers.ai_specialist.description','technological', array['digital_innovator','researcher'], array['math','informatics'], array['build_future','high_income'], array['ml','coding'], 96, true),
  ('cybersecurity_specialist','careers.cybersecurity_specialist.title','careers.cybersecurity_specialist.description','technological', array['digital_innovator','strategist'], array['informatics'], array['protect_systems','high_income'], array['security','networks'], 92, true),
  ('robotics_engineer','careers.robotics_engineer.title','careers.robotics_engineer.description','technological', array['digital_innovator','creator'], array['physics','informatics'], array['build_things'], array['engineering','coding'], 85, true),
  -- research
  ('psychologist','careers.psychologist.title','careers.psychologist.description','research', array['researcher','social_leader'], array['biology'], array['help_people','understand_people'], array['empathy','analysis'], 80, true),
  ('medical_doctor','careers.medical_doctor.title','careers.medical_doctor.description','research', array['researcher','social_leader'], array['biology','chemistry'], array['help_people','stability'], array['diagnosis','care'], 88, true),
  ('biologist','careers.biologist.title','careers.biologist.description','research', array['researcher'], array['biology','chemistry'], array['discover','understand_world'], array['research','lab'], 75, true),
  ('economist_researcher','careers.economist_researcher.title','careers.economist_researcher.description','research', array['researcher','strategist'], array['math','geography'], array['understand_world','high_income'], array['analysis','modeling'], 78, true),
  ('education_researcher','careers.education_researcher.title','careers.education_researcher.description','research', array['researcher','social_leader'], array['history'], array['improve_education','help_people'], array['research','writing'], 70, true),
  -- managerial
  ('project_manager','careers.project_manager.title','careers.project_manager.description','managerial', array['strategist'], array['math'], array['lead_teams','high_income'], array['planning','communication'], 85, true),
  ('entrepreneur','careers.entrepreneur.title','careers.entrepreneur.description','managerial', array['strategist','digital_innovator'], array['math'], array['build_business','independence'], array['leadership','risk'], 88, true),
  ('business_analyst','careers.business_analyst.title','careers.business_analyst.description','managerial', array['strategist','researcher'], array['math','informatics'], array['solve_problems','high_income'], array['analysis','communication'], 84, true),
  ('public_administration_specialist','careers.public_administration_specialist.title','careers.public_administration_specialist.description','managerial', array['strategist','social_leader'], array['history','geography'], array['serve_society','stability'], array['policy','organization'], 72, true),
  ('lawyer','careers.lawyer.title','careers.lawyer.description','managerial', array['strategist','social_leader'], array['history'], array['justice','high_income'], array['argument','writing'], 80, true),
  -- social_humanitarian
  ('teacher','careers.teacher.title','careers.teacher.description','social_humanitarian', array['social_leader'], array['history','languages'], array['help_people','shape_future'], array['communication','patience'], 82, true),
  ('hr_specialist','careers.hr_specialist.title','careers.hr_specialist.description','social_humanitarian', array['social_leader','strategist'], array['languages'], array['help_people','stability'], array['empathy','organization'], 76, true),
  ('social_worker','careers.social_worker.title','careers.social_worker.description','social_humanitarian', array['social_leader'], array['history'], array['help_people','make_impact'], array['empathy','support'], 70, true),
  ('diplomat','careers.diplomat.title','careers.diplomat.description','social_humanitarian', array['social_leader','strategist'], array['languages','history','geography'], array['represent_country','travel'], array['negotiation','languages'], 74, true),
  ('community_project_manager','careers.community_project_manager.title','careers.community_project_manager.description','social_humanitarian', array['social_leader','strategist'], array['history'], array['make_impact','lead_teams'], array['organization','communication'], 68, true),
  -- creative
  ('ux_ui_designer','careers.ux_ui_designer.title','careers.ux_ui_designer.description','creative', array['creator','digital_innovator'], array['art','informatics'], array['build_products','express'], array['design','empathy'], 88, true),
  ('architect','careers.architect.title','careers.architect.description','creative', array['creator','strategist'], array['art','math','physics'], array['build_things','express'], array['design','drafting'], 80, true),
  ('journalist','careers.journalist.title','careers.journalist.description','creative', array['creator','social_leader'], array['languages','history'], array['tell_stories','make_impact'], array['writing','interviewing'], 70, true),
  ('content_creator','careers.content_creator.title','careers.content_creator.description','creative', array['creator','digital_innovator'], array['art','languages'], array['express','independence'], array['storytelling','editing'], 84, true),
  ('marketing_specialist','careers.marketing_specialist.title','careers.marketing_specialist.description','creative', array['creator','strategist'], array['languages','math'], array['high_income','express'], array['communication','analysis'], 86, true)
on conflict (slug) do nothing;

-- 15 starter majors -----------------------------------------------------------
insert into public.majors (slug, title_key, description_key, route, related_career_slugs)
values
  ('computer_science','majors.computer_science.title','majors.computer_science.description','technological', array['software_developer','data_analyst','ai_specialist']),
  ('information_systems','majors.information_systems.title','majors.information_systems.description','technological', array['data_analyst','business_analyst','cybersecurity_specialist']),
  ('robotics_engineering','majors.robotics_engineering.title','majors.robotics_engineering.description','technological', array['robotics_engineer','ai_specialist']),
  ('psychology','majors.psychology.title','majors.psychology.description','research', array['psychologist','social_worker']),
  ('medicine','majors.medicine.title','majors.medicine.description','research', array['medical_doctor']),
  ('biology','majors.biology.title','majors.biology.description','research', array['biologist','medical_doctor']),
  ('business_administration','majors.business_administration.title','majors.business_administration.description','managerial', array['project_manager','entrepreneur','business_analyst']),
  ('economics','majors.economics.title','majors.economics.description','managerial', array['economist_researcher','business_analyst']),
  ('law','majors.law.title','majors.law.description','managerial', array['lawyer','public_administration_specialist']),
  ('education','majors.education.title','majors.education.description','social_humanitarian', array['teacher','education_researcher']),
  ('social_work','majors.social_work.title','majors.social_work.description','social_humanitarian', array['social_worker','community_project_manager']),
  ('international_relations','majors.international_relations.title','majors.international_relations.description','social_humanitarian', array['diplomat','public_administration_specialist']),
  ('design','majors.design.title','majors.design.description','creative', array['ux_ui_designer','content_creator']),
  ('architecture','majors.architecture.title','majors.architecture.description','creative', array['architect']),
  ('journalism','majors.journalism.title','majors.journalism.description','creative', array['journalist','content_creator','marketing_specialist'])
on conflict (slug) do nothing;

-- Demo users ------------------------------------------------------------------
-- Supabase auth users cannot be created safely from plain SQL seed (passwords
-- are hashed by GoTrue). Create a demo student manually:
--   1) Supabase Dashboard → Authentication → Add user (email + password), OR
--      `supabase auth admin create-user --email demo@navigator.kz --password ...`
--   2) The app creates the matching public.profiles row on first onboarding
--      (Day 2). To link manually now:
--        insert into public.profiles (auth_user_id, display_name, grade_level, preferred_language, school_code)
--        values ('<auth-user-uuid>', 'Demo Student', 10, 'ru', 'DEMO-SCHOOL');
