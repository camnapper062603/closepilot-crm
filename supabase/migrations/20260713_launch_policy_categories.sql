begin;

alter table if exists public.launch_readiness_categories
  add column if not exists weight numeric not null default 0,
  add column if not exists status text not null default 'unknown',
  add column if not exists source text not null default 'manual',
  add column if not exists evidence jsonb not null default '{}'::jsonb,
  add column if not exists checked_at timestamptz;

alter table if exists public.launch_provider_status
  add column if not exists source text not null default 'manual',
  add column if not exists evidence jsonb not null default '{}'::jsonb;

alter table if exists public.launch_provider_status
  drop constraint if exists launch_provider_status_status_check,
  add constraint launch_provider_status_status_check
    check (status in ('connected', 'healthy', 'configured', 'passed', 'pass', 'ready', 'complete', 'setup_required', 'not_connected', 'not_configured', 'unknown', 'degraded', 'blocked', 'failed', 'failing', 'error'));

alter table if exists public.launch_checklist_items
  add column if not exists status text not null default 'unknown',
  add column if not exists required boolean not null default false,
  add column if not exists required_stages text[] not null default '{}'::text[],
  add column if not exists evidence jsonb not null default '{}'::jsonb;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'launch_readiness_categories_status_check'
      and conrelid = 'public.launch_readiness_categories'::regclass
  ) then
    alter table public.launch_readiness_categories
      add constraint launch_readiness_categories_status_check
      check (status in ('unknown', 'passed', 'warning', 'fail'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'launch_readiness_categories_source_check'
      and conrelid = 'public.launch_readiness_categories'::regclass
  ) then
    alter table public.launch_readiness_categories
      add constraint launch_readiness_categories_source_check
      check (source in ('manual', 'automatic', 'imported', 'seed', 'missing'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'launch_checklist_items_status_check'
      and conrelid = 'public.launch_checklist_items'::regclass
  ) then
    alter table public.launch_checklist_items
      add constraint launch_checklist_items_status_check
      check (status in ('unknown', 'passed', 'failed', 'complete', 'skipped'));
  end if;
end $$;

create index if not exists launch_readiness_categories_status_idx
  on public.launch_readiness_categories(status, category_key);

create index if not exists launch_checklist_items_status_idx
  on public.launch_checklist_items(status, required);

insert into public.launch_readiness_categories (category_key, score, weight, status, source, detail)
values
  ('security', 0, 14, 'unknown', 'seed', 'Seeded readiness category. Add evidence before launch.'),
  ('authentication', 0, 12, 'unknown', 'seed', 'Seeded readiness category. Add evidence before launch.'),
  ('backend', 0, 10, 'unknown', 'seed', 'Seeded readiness category. Add evidence before launch.'),
  ('frontend', 0, 8, 'unknown', 'seed', 'Seeded readiness category. Add evidence before launch.'),
  ('billing', 0, 8, 'unknown', 'seed', 'Seeded readiness category. Add evidence before launch.'),
  ('testing', 0, 10, 'unknown', 'seed', 'Seeded readiness category. Add evidence before launch.'),
  ('deployment', 0, 9, 'unknown', 'seed', 'Seeded readiness category. Add evidence before launch.'),
  ('production_operations', 0, 8, 'unknown', 'seed', 'Seeded readiness category. Add evidence before launch.'),
  ('mobile', 0, 4, 'unknown', 'seed', 'Seeded readiness category. Add evidence before launch.'),
  ('documentation', 0, 6, 'unknown', 'seed', 'Seeded readiness category. Add evidence before launch.'),
  ('customer_experience', 0, 6, 'unknown', 'seed', 'Seeded readiness category. Add evidence before launch.'),
  ('legal_compliance', 0, 5, 'unknown', 'seed', 'Seeded readiness category. Add evidence before launch.')
on conflict (category_key) do nothing;

insert into public.launch_checklist_items (item_key, label, category, required, required_stages, status)
values
  ('auth-confirmed', 'Auth, email confirmation, and role gates verified', 'Security', true, array['development','security_hardening','beta_certification','private_beta','paying_pilot','public_launch'], 'unknown'),
  ('rls-verified', 'Supabase RLS and tenant isolation checks passed', 'Security', true, array['security_hardening','beta_certification','private_beta','paying_pilot','public_launch'], 'unknown'),
  ('billing-trial', '7-day trial and billing checkout verified', 'Revenue', true, array['paying_pilot','public_launch'], 'unknown'),
  ('billing-cancel', 'Cancellation and billing support path verified', 'Revenue', true, array['paying_pilot','public_launch'], 'unknown'),
  ('invite-flow', 'Owner/admin invite flow verified end-to-end', 'Customer onboarding', true, array['beta_certification','private_beta','paying_pilot','public_launch'], 'unknown'),
  ('crm-daily-command', 'Customer daily command center validated with live workspace data', 'Product', true, array['beta_certification','private_beta','paying_pilot','public_launch'], 'unknown'),
  ('kira-recruit-addon', 'Kira Recruit add-on gates and CRM handoff validated', 'Product', true, array['private_beta','paying_pilot','public_launch'], 'unknown'),
  ('release-gates', 'Build, security tests, route inventory, and browser smoke pass', 'Release', true, array['beta_certification','private_beta','paying_pilot','public_launch'], 'unknown'),
  ('monitoring-ready', 'Production monitoring and escalation path verified', 'Operations', true, array['paying_pilot','public_launch'], 'unknown'),
  ('data-export', 'Customer data export and support process verified', 'Operations', true, array['paying_pilot','public_launch'], 'unknown'),
  ('legal-ready', 'Legal, privacy, and compliance docs ready', 'Legal', true, array['paying_pilot','public_launch'], 'unknown'),
  ('self-service-onboarding', 'Self-service onboarding path verified', 'Customer onboarding', true, array['public_launch'], 'unknown'),
  ('docs-complete', 'Beta docs, status docs, and setup docs are current', 'Operations', true, array['beta_certification','private_beta','paying_pilot','public_launch'], 'unknown'),
  ('support-ready', 'Support contact, escalation path, and beta feedback loop ready', 'Operations', true, array['private_beta','paying_pilot','public_launch'], 'unknown')
on conflict (item_key) do nothing;

commit;
