begin;

alter table if exists public.launch_blockers
  add column if not exists category text not null default '',
  add column if not exists evidence_url text not null default '',
  add column if not exists evidence_text text not null default '',
  add column if not exists resolution_notes text not null default '',
  add column if not exists accepted_risk_reason text not null default '',
  add column if not exists accepted_risk_by text not null default '',
  add column if not exists accepted_risk_at timestamptz,
  add column if not exists launch_blocking boolean not null default true,
  add column if not exists target_stage text not null default 'private_beta',
  add column if not exists owner_user_id uuid references auth.users(id) on delete set null,
  add column if not exists resolved_by text not null default '',
  add column if not exists resolved_at timestamptz;

alter table if exists public.launch_blockers
  drop constraint if exists launch_blockers_status_check,
  add constraint launch_blockers_status_check
    check (status in ('open', 'in_progress', 'blocked', 'resolved', 'accepted_risk', 'accepted'));

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'launch_blockers_target_stage_check'
      and conrelid = 'public.launch_blockers'::regclass
  ) then
    alter table public.launch_blockers
      add constraint launch_blockers_target_stage_check
      check (target_stage in ('development', 'security_hardening', 'beta_certification', 'private_beta', 'paying_pilot', 'public_launch'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'launch_blockers_evidence_url_check'
      and conrelid = 'public.launch_blockers'::regclass
  ) then
    alter table public.launch_blockers
      add constraint launch_blockers_evidence_url_check
      check (evidence_url = '' or evidence_url ~* '^https?://');
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'launch_blockers_accepted_risk_reason_check'
      and conrelid = 'public.launch_blockers'::regclass
  ) then
    alter table public.launch_blockers
      add constraint launch_blockers_accepted_risk_reason_check
      check (status not in ('accepted_risk', 'accepted') or length(trim(accepted_risk_reason)) > 0);
  end if;
end $$;

alter table if exists public.launch_beta_accounts
  add column if not exists contact_name text not null default '',
  add column if not exists contact_email text not null default '',
  add column if not exists contact_phone text not null default '',
  add column if not exists industry text not null default '',
  add column if not exists onboarding_stage text not null default 'not_started',
  add column if not exists beta_status text not null default 'prospect',
  add column if not exists start_date date,
  add column if not exists last_activity_at timestamptz,
  add column if not exists open_issue_count integer not null default 0,
  add column if not exists feedback_count integer not null default 0,
  add column if not exists conversion_likelihood integer not null default 0,
  add column if not exists pilot_price numeric not null default 0,
  add column if not exists expected_conversion_date date,
  add column if not exists assigned_owner text not null default '',
  add column if not exists next_action text not null default '',
  add column if not exists next_action_due_at timestamptz;

alter table if exists public.launch_beta_accounts
  drop constraint if exists launch_beta_accounts_status_check,
  add constraint launch_beta_accounts_status_check
    check (status in ('prospect', 'candidate', 'invited', 'onboarding', 'active', 'paused', 'completed', 'graduated', 'converted', 'churned'));

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'launch_beta_accounts_beta_status_check'
      and conrelid = 'public.launch_beta_accounts'::regclass
  ) then
    alter table public.launch_beta_accounts
      add constraint launch_beta_accounts_beta_status_check
      check (beta_status in ('prospect', 'invited', 'onboarding', 'active', 'paused', 'completed', 'converted', 'churned'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'launch_beta_accounts_onboarding_stage_check'
      and conrelid = 'public.launch_beta_accounts'::regclass
  ) then
    alter table public.launch_beta_accounts
      add constraint launch_beta_accounts_onboarding_stage_check
      check (onboarding_stage in ('not_started', 'account_created', 'workspace_configured', 'data_imported', 'team_invited', 'provider_connected', 'training_completed', 'live_usage'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'launch_beta_accounts_contact_email_check'
      and conrelid = 'public.launch_beta_accounts'::regclass
  ) then
    alter table public.launch_beta_accounts
      add constraint launch_beta_accounts_contact_email_check
      check (contact_email = '' or contact_email ~* '^[^[:space:]@]+@[^[:space:]@]+\\.[^[:space:]@]+$');
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'launch_beta_accounts_conversion_likelihood_check'
      and conrelid = 'public.launch_beta_accounts'::regclass
  ) then
    alter table public.launch_beta_accounts
      add constraint launch_beta_accounts_conversion_likelihood_check
      check (conversion_likelihood between 0 and 100);
  end if;
end $$;

alter table if exists public.tasks
  add column if not exists assigned_to text,
  add column if not exists created_by uuid references auth.users(id) on delete set null,
  add column if not exists completed_by uuid references auth.users(id) on delete set null,
  add column if not exists completed_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

alter table if exists public.activities
  add column if not exists created_by uuid references auth.users(id) on delete set null,
  add column if not exists actor_user_id uuid references auth.users(id) on delete set null,
  add column if not exists member_id uuid references auth.users(id) on delete set null,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table if exists public.communications
  add column if not exists created_by uuid references auth.users(id) on delete set null,
  add column if not exists sent_by uuid references auth.users(id) on delete set null,
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists member_id uuid references auth.users(id) on delete set null;

alter table if exists public.calls
  add column if not exists recorded_by uuid references auth.users(id) on delete set null,
  add column if not exists created_by uuid references auth.users(id) on delete set null,
  add column if not exists user_id uuid references auth.users(id) on delete set null;

alter table if exists public.appointments
  add column if not exists assigned_user_id uuid references auth.users(id) on delete set null,
  add column if not exists booked_by uuid references auth.users(id) on delete set null,
  add column if not exists created_by uuid references auth.users(id) on delete set null;

create index if not exists launch_blockers_target_stage_idx
  on public.launch_blockers(target_stage, status, severity);

create index if not exists launch_beta_accounts_beta_status_idx
  on public.launch_beta_accounts(beta_status, onboarding_stage);

create index if not exists tasks_workspace_assigned_idx
  on public.tasks(workspace_id, assigned_to, done);

create index if not exists communications_workspace_sent_by_idx
  on public.communications(workspace_id, sent_by, created_at desc);

create index if not exists activities_workspace_actor_idx
  on public.activities(workspace_id, actor_user_id, created_at desc);

commit;
