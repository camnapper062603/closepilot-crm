create extension if not exists pgcrypto;

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Personal workspace',
  created_at timestamptz not null default now()
);

create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'admin', 'manager', 'member')),
  team_function text check (team_function is null or team_function in ('dialer', 'setter', 'closer')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  company text not null,
  stage text not null default 'new' check (stage in ('new', 'qualified', 'proposal', 'won')),
  value numeric not null default 0,
  score integer not null default 65 check (score between 0 and 100),
  notes text not null default '',
  next_action text not null default '',
  source text not null default 'Manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  text text not null,
  done boolean not null default false,
  due text not null default 'today',
  created_at timestamptz not null default now()
);

create table if not exists public.automations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  automation_key text not null,
  title text not null,
  detail text not null,
  enabled boolean not null default true,
  saved_hours integer not null default 0,
  created_at timestamptz not null default now(),
  unique (workspace_id, automation_key)
);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  type text not null default 'note',
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.recruiting_candidates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  external_id text not null,
  name text not null,
  role text not null default '',
  source text not null default 'Kira Recruit',
  interview_status text not null default 'New',
  interview_at timestamptz,
  score integer not null default 65 check (score between 0 and 100),
  next_action text not null default '',
  email text not null default '',
  phone text not null default '',
  assigned_recruiter text not null default '',
  assigned_manager text not null default '',
  hiring_outcome text not null default 'screening' check (hiring_outcome in ('screening', 'interviewing', 'offer', 'hired', 'not_selected', 'nurture')),
  recruiter_notes text not null default '',
  status text not null default 'new' check (status in ('new', 'reviewed', 'converted')),
  converted_lead_id uuid references public.leads(id) on delete set null,
  converted_member_invitation_id uuid references public.workspace_invitations(id) on delete set null,
  follow_up_task_id uuid references public.tasks(id) on delete set null,
  activity_note_id uuid references public.activities(id) on delete set null,
  reviewed_at timestamptz,
  last_handoff_at timestamptz,
  synced_at timestamptz not null default now(),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, external_id)
);

create table if not exists public.workspace_subscriptions (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  plan text not null default 'starter' check (plan in ('starter', 'growth', 'scale')),
  status text not null default 'trialing' check (status in ('trialing', 'active', 'past_due', 'canceled')),
  seat_limit integer not null default 75 check (seat_limit >= 0),
  trial_ends_at timestamptz default (now() + interval '7 days'),
  current_period_end timestamptz,
  stripe_customer_id text,
  stripe_subscription_id text,
  updated_at timestamptz not null default now()
);

create table if not exists public.workspace_addons (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  addon_key text not null check (addon_key in ('recruiting', 'leadgen', 'bundle')),
  status text not null default 'locked' check (status in ('locked', 'requested', 'trialing', 'active', 'early_access', 'canceled')),
  trial_ends_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, addon_key)
);

create table if not exists public.recruiting_app_state (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  job jsonb not null default '{}'::jsonb,
  postings jsonb not null default '[]'::jsonb,
  integrations_public jsonb not null default '{}'::jsonb,
  connector_settings jsonb not null default '{}'::jsonb,
  interviews jsonb not null default '[]'::jsonb,
  onboarding_workers jsonb not null default '[]'::jsonb,
  payroll_provider_public jsonb not null default '{}'::jsonb,
  payroll_runs jsonb not null default '[]'::jsonb,
  recruiter_notes jsonb not null default '[]'::jsonb,
  hiring_outcomes jsonb not null default '[]'::jsonb,
  crm_handoffs jsonb not null default '[]'::jsonb,
  feed_synced_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.workspace_invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  email text not null,
  role text not null default 'member' check (role in ('admin', 'manager', 'member')),
  team_function text check (team_function is null or team_function in ('dialer', 'setter', 'closer')),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked')),
  invite_token_hash text,
  expires_at timestamptz,
  accepted_at timestamptz,
  temporary_password_hash text,
  temporary_password_expires_at timestamptz,
  temporary_password_changed_at timestamptz,
  onboarding_started_at timestamptz,
  created_at timestamptz not null default now(),
  unique (workspace_id, email)
);

create table if not exists public.workspace_audit_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  action text not null,
  detail text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.communications (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  channel text not null default 'note' check (channel in ('sms', 'email', 'call', 'draft', 'scheduled', 'note')),
  direction text not null default 'outgoing' check (direction in ('incoming', 'outgoing', 'system')),
  status text not null default 'logged',
  subject text not null default '',
  body text not null default '',
  provider text not null default 'demo',
  provider_message_id text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.message_drafts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  channel text not null default 'sms',
  body text not null default '',
  scheduled_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.calls (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  phone text not null default '',
  outcome text not null default 'logged',
  duration_seconds integer not null default 0,
  provider text not null default 'demo',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  title text not null default '',
  starts_at timestamptz not null,
  assigned_to text not null default '',
  status text not null default 'booked',
  notes text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  category text not null default 'system',
  title text not null,
  detail text not null default '',
  read_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.files (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  bucket text not null default 'workspace-files',
  path text not null,
  name text not null,
  mime_type text not null default '',
  size_bytes bigint not null default 0,
  category text not null default 'attachment',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.customer_portal_records (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  token_hash text not null,
  status text not null default 'active',
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  title text not null,
  status text not null default 'job_scheduled',
  scheduled_at timestamptz,
  crew text not null default '',
  notes text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.automation_runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  automation_id uuid,
  workflow_name text not null default '',
  lead_id uuid references public.leads(id) on delete set null,
  status text not null default 'success',
  detail text not null default '',
  duration_ms integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_outputs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  output_type text not null,
  provider text not null default 'fallback',
  prompt text not null default '',
  output jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.onboarding_state (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  completed boolean not null default false,
  checklist jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.workspace_settings (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  business_profile jsonb not null default '{}'::jsonb,
  branding jsonb not null default '{}'::jsonb,
  working_hours jsonb not null default '{}'::jsonb,
  lead_stages jsonb not null default '{}'::jsonb,
  notification_settings jsonb not null default '{}'::jsonb,
  ai_preferences jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.integration_settings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  provider text not null,
  status text not null default 'not_configured',
  public_config jsonb not null default '{}'::jsonb,
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, provider)
);

create table if not exists public.calendar_connections (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  provider text not null default 'google',
  google_account_email text not null default '',
  calendar_id text not null default 'primary',
  access_token text not null default '',
  refresh_token text not null default '',
  access_token_ciphertext text not null default '',
  access_token_iv text not null default '',
  access_token_tag text not null default '',
  refresh_token_ciphertext text not null default '',
  refresh_token_iv text not null default '',
  refresh_token_tag text not null default '',
  token_key_version text not null default 'v1',
  scope text not null default '',
  expires_at timestamptz,
  status text not null default 'connected',
  metadata jsonb not null default '{}'::jsonb,
  last_sync_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.workspace_subscriptions
  add column if not exists current_period_end timestamptz,
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text;

alter table if exists public.workspace_subscriptions
  alter column trial_ends_at drop not null;

alter table if exists public.workspace_subscriptions
  alter column trial_ends_at set default (now() + interval '7 days');

alter table if exists public.workspace_subscriptions
  alter column seat_limit set default 75;

alter table if exists public.workspace_subscriptions
  drop constraint if exists workspace_subscriptions_seat_limit_check,
  add constraint workspace_subscriptions_seat_limit_check check (seat_limit >= 0);

update public.workspace_subscriptions
set seat_limit = case plan
  when 'starter' then 75
  when 'growth' then 200
  when 'scale' then 0
  else seat_limit
end
where plan in ('starter', 'growth', 'scale');

alter table if exists public.workspace_invitations
  add column if not exists invite_token_hash text,
  add column if not exists expires_at timestamptz,
  add column if not exists accepted_at timestamptz,
  add column if not exists temporary_password_hash text,
  add column if not exists temporary_password_expires_at timestamptz,
  add column if not exists temporary_password_changed_at timestamptz,
  add column if not exists onboarding_started_at timestamptz,
  add column if not exists team_function text;

alter table if exists public.workspace_members
  add column if not exists team_function text;

alter table if exists public.leads
  add column if not exists assigned_to text;

alter table if exists public.recruiting_candidates
  add column if not exists assigned_recruiter text not null default '',
  add column if not exists assigned_manager text not null default '',
  add column if not exists hiring_outcome text not null default 'screening',
  add column if not exists recruiter_notes text not null default '',
  add column if not exists converted_member_invitation_id uuid references public.workspace_invitations(id) on delete set null,
  add column if not exists follow_up_task_id uuid references public.tasks(id) on delete set null,
  add column if not exists activity_note_id uuid references public.activities(id) on delete set null,
  add column if not exists last_handoff_at timestamptz;

alter table if exists public.recruiting_candidates
  drop constraint if exists recruiting_candidates_hiring_outcome_check,
  add constraint recruiting_candidates_hiring_outcome_check check (hiring_outcome in ('screening', 'interviewing', 'offer', 'hired', 'not_selected', 'nurture'));

alter table if exists public.recruiting_app_state
  add column if not exists connector_settings jsonb not null default '{}'::jsonb,
  add column if not exists recruiter_notes jsonb not null default '[]'::jsonb,
  add column if not exists hiring_outcomes jsonb not null default '[]'::jsonb,
  add column if not exists crm_handoffs jsonb not null default '[]'::jsonb;

alter table if exists public.calendar_connections
  add column if not exists access_token_ciphertext text not null default '',
  add column if not exists access_token_iv text not null default '',
  add column if not exists access_token_tag text not null default '',
  add column if not exists refresh_token_ciphertext text not null default '',
  add column if not exists refresh_token_iv text not null default '',
  add column if not exists refresh_token_tag text not null default '',
  add column if not exists token_key_version text not null default 'v1',
  add column if not exists last_sync_at timestamptz;

alter table if exists public.workspace_members
  drop constraint if exists workspace_members_role_check,
  add constraint workspace_members_role_check check (role in ('owner', 'admin', 'manager', 'member'));

alter table if exists public.workspace_members
  drop constraint if exists workspace_members_team_function_check,
  add constraint workspace_members_team_function_check check (team_function is null or team_function in ('dialer', 'setter', 'closer'));

alter table if exists public.workspace_invitations
  drop constraint if exists workspace_invitations_role_check,
  add constraint workspace_invitations_role_check check (role in ('admin', 'manager', 'member'));

alter table if exists public.workspace_invitations
  drop constraint if exists workspace_invitations_team_function_check,
  add constraint workspace_invitations_team_function_check check (team_function is null or team_function in ('dialer', 'setter', 'closer'));

create unique index if not exists workspace_invitations_invite_token_hash_idx
  on public.workspace_invitations(invite_token_hash)
  where invite_token_hash is not null;

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.leads enable row level security;
alter table public.tasks enable row level security;
alter table public.automations enable row level security;
alter table public.activities enable row level security;
alter table public.recruiting_candidates enable row level security;
alter table public.workspace_subscriptions enable row level security;
alter table public.workspace_addons enable row level security;
alter table public.recruiting_app_state enable row level security;
alter table public.workspace_invitations enable row level security;
alter table public.workspace_audit_events enable row level security;
alter table public.communications enable row level security;
alter table public.message_drafts enable row level security;
alter table public.calls enable row level security;
alter table public.appointments enable row level security;
alter table public.notifications enable row level security;
alter table public.files enable row level security;
alter table public.customer_portal_records enable row level security;
alter table public.jobs enable row level security;
alter table public.automation_runs enable row level security;
alter table public.ai_outputs enable row level security;
alter table public.onboarding_state enable row level security;
alter table public.workspace_settings enable row level security;
alter table public.integration_settings enable row level security;
alter table public.calendar_connections enable row level security;

create index if not exists leads_workspace_stage_idx on public.leads(workspace_id, stage);
create index if not exists tasks_workspace_due_idx on public.tasks(workspace_id, due);
create index if not exists activities_workspace_lead_idx on public.activities(workspace_id, lead_id, created_at desc);
create index if not exists workspace_addons_workspace_key_idx on public.workspace_addons(workspace_id, addon_key);
create index if not exists recruiting_candidates_workspace_outcome_idx on public.recruiting_candidates(workspace_id, hiring_outcome);
create index if not exists recruiting_candidates_workspace_recruiter_idx on public.recruiting_candidates(workspace_id, assigned_recruiter);
create index if not exists communications_workspace_lead_idx on public.communications(workspace_id, lead_id, created_at desc);
create index if not exists appointments_workspace_starts_idx on public.appointments(workspace_id, starts_at);
create index if not exists notifications_workspace_read_idx on public.notifications(workspace_id, read_at, created_at desc);
create index if not exists files_workspace_lead_idx on public.files(workspace_id, lead_id, created_at desc);
create index if not exists jobs_workspace_status_idx on public.jobs(workspace_id, status);
create index if not exists automation_runs_workspace_created_idx on public.automation_runs(workspace_id, created_at desc);
create index if not exists ai_outputs_workspace_lead_idx on public.ai_outputs(workspace_id, lead_id, created_at desc);
create index if not exists calendar_connections_workspace_status_idx on public.calendar_connections(workspace_id, status);

create or replace view public.calendar_connection_status
with (security_invoker = true)
as
select
  workspace_id,
  provider,
  google_account_email,
  calendar_id,
  scope,
  expires_at,
  status,
  metadata,
  created_at,
  updated_at,
  last_sync_at,
  token_key_version,
  (
    coalesce(nullif(refresh_token_ciphertext, ''), nullif(access_token_ciphertext, ''), nullif(refresh_token, ''), nullif(access_token, ''))
    is not null
  ) as connected
from public.calendar_connections;

revoke all on public.calendar_connections from anon;
revoke all on public.calendar_connections from authenticated;
grant all on public.calendar_connections to service_role;
grant select on public.calendar_connection_status to authenticated;

create or replace function public.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members
    where workspace_id = target_workspace_id
      and user_id = auth.uid()
  );
$$;

create or replace function public.is_workspace_owner(target_workspace_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspaces
    where id = target_workspace_id
      and owner_id = auth.uid()
  );
$$;

create or replace function public.is_workspace_admin(target_workspace_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspaces
    where id = target_workspace_id
      and owner_id = auth.uid()
  )
  or exists (
    select 1
    from public.workspace_members
    where workspace_id = target_workspace_id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
  );
$$;

create or replace function public.is_workspace_manager(target_workspace_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members
    where workspace_id = target_workspace_id
      and user_id = auth.uid()
      and role in ('owner', 'admin', 'manager')
  );
$$;

revoke execute on function public.is_workspace_member(uuid) from public;
revoke execute on function public.is_workspace_member(uuid) from anon;
grant execute on function public.is_workspace_member(uuid) to authenticated;

revoke execute on function public.is_workspace_owner(uuid) from public;
revoke execute on function public.is_workspace_owner(uuid) from anon;
grant execute on function public.is_workspace_owner(uuid) to authenticated;

revoke execute on function public.is_workspace_admin(uuid) from public;
revoke execute on function public.is_workspace_admin(uuid) from anon;
grant execute on function public.is_workspace_admin(uuid) to authenticated;

revoke execute on function public.is_workspace_manager(uuid) from public;
revoke execute on function public.is_workspace_manager(uuid) from anon;
grant execute on function public.is_workspace_manager(uuid) to authenticated;

do $$
begin
  if exists (
    select 1
    from pg_proc
    join pg_namespace on pg_namespace.oid = pg_proc.pronamespace
    where pg_namespace.nspname = 'public'
      and pg_proc.proname = 'rls_auto_enable'
      and pg_get_function_identity_arguments(pg_proc.oid) = ''
  ) then
    revoke execute on function public.rls_auto_enable() from public;
    revoke execute on function public.rls_auto_enable() from anon;
  end if;
end $$;

drop policy if exists "Users can see their workspaces" on public.workspaces;
drop policy if exists "Users can create owned workspaces" on public.workspaces;
drop policy if exists "Owners can update workspaces" on public.workspaces;
drop policy if exists "Users can see workspace members" on public.workspace_members;
drop policy if exists "Users can add themselves to owned workspaces" on public.workspace_members;
drop policy if exists "Invited users can join workspaces" on public.workspace_members;
drop policy if exists "Admins can update workspace members" on public.workspace_members;
drop policy if exists "Admins can remove workspace members" on public.workspace_members;
drop policy if exists "Members can read leads" on public.leads;
drop policy if exists "Members can insert leads" on public.leads;
drop policy if exists "Members can update leads" on public.leads;
drop policy if exists "Members can delete leads" on public.leads;
drop policy if exists "Members can manage tasks" on public.tasks;
drop policy if exists "Members can manage automations" on public.automations;
drop policy if exists "Members can manage activities" on public.activities;
drop policy if exists "Members can manage recruiting candidates" on public.recruiting_candidates;
drop policy if exists "Members can manage subscriptions" on public.workspace_subscriptions;
drop policy if exists "Members can read workspace add-ons" on public.workspace_addons;
drop policy if exists "Admins can manage workspace add-ons" on public.workspace_addons;
drop policy if exists "Managers can read recruiting app state" on public.recruiting_app_state;
drop policy if exists "Managers can manage recruiting app state" on public.recruiting_app_state;
drop policy if exists "Members can manage invitations" on public.workspace_invitations;
drop policy if exists "Invited users can read their own pending invitations" on public.workspace_invitations;
drop policy if exists "Members can manage audit events" on public.workspace_audit_events;
drop policy if exists "Members can manage communications" on public.communications;
drop policy if exists "Members can manage message drafts" on public.message_drafts;
drop policy if exists "Members can manage calls" on public.calls;
drop policy if exists "Members can manage appointments" on public.appointments;
drop policy if exists "Members can manage notifications" on public.notifications;
drop policy if exists "Members can manage files" on public.files;
drop policy if exists "Members can manage customer portal records" on public.customer_portal_records;
drop policy if exists "Members can manage jobs" on public.jobs;
drop policy if exists "Members can manage automation runs" on public.automation_runs;
drop policy if exists "Members can manage AI outputs" on public.ai_outputs;
drop policy if exists "Members can manage onboarding state" on public.onboarding_state;
drop policy if exists "Members can manage workspace settings" on public.workspace_settings;
drop policy if exists "Members can manage integration settings" on public.integration_settings;
drop policy if exists "Members can manage calendar connections" on public.calendar_connections;
drop policy if exists "Members can read calendar connections" on public.calendar_connections;
drop policy if exists "Admins can manage calendar connections" on public.calendar_connections;
drop policy if exists "Members can read calendar connection status" on public.calendar_connections;
drop policy if exists "Service role manages calendar connections" on public.calendar_connections;
drop policy if exists "Admins can delete leads" on public.leads;
drop policy if exists "Members can read automations" on public.automations;
drop policy if exists "Managers can manage automations" on public.automations;
drop policy if exists "Managers can manage recruiting candidates" on public.recruiting_candidates;
drop policy if exists "Members can read subscriptions" on public.workspace_subscriptions;
drop policy if exists "Admins can manage subscriptions" on public.workspace_subscriptions;
drop policy if exists "Members can read invitations" on public.workspace_invitations;
drop policy if exists "Admins can manage invitations" on public.workspace_invitations;
drop policy if exists "Members can read workspace settings" on public.workspace_settings;
drop policy if exists "Admins can manage workspace settings" on public.workspace_settings;
drop policy if exists "Members can read integration settings" on public.integration_settings;
drop policy if exists "Admins can manage integration settings" on public.integration_settings;

create policy "Users can see their workspaces"
  on public.workspaces for select
  using (owner_id = auth.uid() or public.is_workspace_member(id));

create policy "Users can create owned workspaces"
  on public.workspaces for insert
  with check (owner_id = auth.uid());

create policy "Owners can update workspaces"
  on public.workspaces for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "Users can see workspace members"
  on public.workspace_members for select
  using (user_id = auth.uid() or public.is_workspace_member(workspace_id));

create policy "Users can add themselves to owned workspaces"
  on public.workspace_members for insert
  with check (
    user_id = auth.uid()
    and role = 'owner'
    and public.is_workspace_owner(workspace_id)
  );

create policy "Invited users can join workspaces"
  on public.workspace_members for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.workspace_invitations invitation
      where invitation.workspace_id = workspace_members.workspace_id
        and lower(invitation.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
        and invitation.status = 'pending'
        and (invitation.expires_at is null or invitation.expires_at > now())
    )
  );

create policy "Admins can update workspace members"
  on public.workspace_members for update
  using (
    public.is_workspace_admin(workspace_id)
    and user_id <> auth.uid()
    and role <> 'owner'
  )
  with check (
    public.is_workspace_admin(workspace_id)
    and user_id <> auth.uid()
    and role in ('admin', 'manager', 'member')
  );

create policy "Admins can remove workspace members"
  on public.workspace_members for delete
  using (
    public.is_workspace_admin(workspace_id)
    and user_id <> auth.uid()
    and role <> 'owner'
  );

create policy "Members can read leads"
  on public.leads for select
  using (public.is_workspace_member(workspace_id));

create policy "Members can insert leads"
  on public.leads for insert
  with check (public.is_workspace_member(workspace_id));

create policy "Members can update leads"
  on public.leads for update
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy "Admins can delete leads"
  on public.leads for delete
  using (public.is_workspace_admin(workspace_id));

create policy "Members can manage tasks"
  on public.tasks for all
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy "Members can read automations"
  on public.automations for select
  using (public.is_workspace_member(workspace_id));

create policy "Managers can manage automations"
  on public.automations for all
  using (public.is_workspace_manager(workspace_id))
  with check (public.is_workspace_manager(workspace_id));

create policy "Members can manage activities"
  on public.activities for all
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy "Managers can manage recruiting candidates"
  on public.recruiting_candidates for all
  using (public.is_workspace_manager(workspace_id))
  with check (public.is_workspace_manager(workspace_id));

create policy "Managers can read recruiting app state"
  on public.recruiting_app_state for select
  using (public.is_workspace_manager(workspace_id));

create policy "Managers can manage recruiting app state"
  on public.recruiting_app_state for all
  using (public.is_workspace_manager(workspace_id))
  with check (public.is_workspace_manager(workspace_id));

create policy "Members can read subscriptions"
  on public.workspace_subscriptions for select
  using (public.is_workspace_member(workspace_id));

create policy "Admins can manage subscriptions"
  on public.workspace_subscriptions for all
  using (public.is_workspace_admin(workspace_id))
  with check (public.is_workspace_admin(workspace_id));

create policy "Members can read workspace add-ons"
  on public.workspace_addons for select
  using (public.is_workspace_member(workspace_id));

create policy "Admins can manage workspace add-ons"
  on public.workspace_addons for all
  using (public.is_workspace_admin(workspace_id))
  with check (public.is_workspace_admin(workspace_id));

create policy "Members can read invitations"
  on public.workspace_invitations for select
  using (public.is_workspace_member(workspace_id));

create policy "Admins can manage invitations"
  on public.workspace_invitations for all
  using (public.is_workspace_admin(workspace_id))
  with check (public.is_workspace_admin(workspace_id));

create policy "Members can read workspace settings"
  on public.workspace_settings for select
  using (public.is_workspace_member(workspace_id));

create policy "Invited users can read their own pending invitations"
  on public.workspace_invitations for select
  using (
    lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    and status = 'pending'
    and (expires_at is null or expires_at > now())
  );

create policy "Members can manage audit events"
  on public.workspace_audit_events for all
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy "Members can manage communications"
  on public.communications for all
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy "Members can manage message drafts"
  on public.message_drafts for all
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy "Members can manage calls"
  on public.calls for all
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy "Members can manage appointments"
  on public.appointments for all
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy "Members can manage notifications"
  on public.notifications for all
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy "Members can manage files"
  on public.files for all
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy "Members can manage customer portal records"
  on public.customer_portal_records for all
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy "Members can manage jobs"
  on public.jobs for all
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy "Members can manage automation runs"
  on public.automation_runs for all
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy "Members can manage AI outputs"
  on public.ai_outputs for all
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy "Members can manage onboarding state"
  on public.onboarding_state for all
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy "Admins can manage workspace settings"
  on public.workspace_settings for all
  using (public.is_workspace_admin(workspace_id))
  with check (public.is_workspace_admin(workspace_id));

create policy "Members can read integration settings"
  on public.integration_settings for select
  using (public.is_workspace_member(workspace_id));

create policy "Admins can manage integration settings"
  on public.integration_settings for all
  using (public.is_workspace_admin(workspace_id))
  with check (public.is_workspace_admin(workspace_id));

create policy "Members can read calendar connection status"
  on public.calendar_connections for select
  using (public.is_workspace_member(workspace_id));

create policy "Service role manages calendar connections"
  on public.calendar_connections for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create table if not exists public.launch_readiness_categories (
  category_key text primary key,
  score integer not null default 0 check (score between 0 and 100),
  detail text not null default '',
  updated_by text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.launch_provider_status (
  provider_key text primary key,
  status text not null default 'not_connected' check (status in ('connected', 'healthy', 'configured', 'setup_required', 'not_connected', 'degraded', 'blocked')),
  display_status text not null default '',
  detail text not null default '',
  checked_at timestamptz,
  updated_by text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.launch_blockers (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  detail text not null default '',
  severity text not null default 'medium' check (severity in ('critical', 'high', 'medium', 'low')),
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved', 'accepted')),
  owner text not null default '',
  due_at timestamptz,
  updated_by text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.launch_checklist_items (
  item_key text primary key,
  label text not null default '',
  category text not null default '',
  completed boolean not null default false,
  note text not null default '',
  completed_at timestamptz,
  updated_by text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.launch_beta_accounts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete set null,
  company_name text not null,
  status text not null default 'candidate' check (status in ('candidate', 'invited', 'active', 'paused', 'graduated', 'churned')),
  owner text not null default '',
  notes text not null default '',
  updated_by text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.launch_status_snapshots (
  id uuid primary key default gen_random_uuid(),
  snapshot jsonb not null default '{}'::jsonb,
  created_by text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.workspace_daily_goals (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  goals jsonb not null default '{}'::jsonb,
  updated_by text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.launch_readiness_categories enable row level security;
alter table public.launch_provider_status enable row level security;
alter table public.launch_blockers enable row level security;
alter table public.launch_checklist_items enable row level security;
alter table public.launch_beta_accounts enable row level security;
alter table public.launch_status_snapshots enable row level security;
alter table public.workspace_daily_goals enable row level security;

create index if not exists launch_blockers_status_severity_idx on public.launch_blockers(status, severity, created_at desc);
create index if not exists launch_beta_accounts_status_idx on public.launch_beta_accounts(status, created_at desc);
create index if not exists launch_status_snapshots_created_idx on public.launch_status_snapshots(created_at desc);

drop policy if exists "Service role can manage launch readiness categories" on public.launch_readiness_categories;
drop policy if exists "Service role can manage launch provider status" on public.launch_provider_status;
drop policy if exists "Service role can manage launch blockers" on public.launch_blockers;
drop policy if exists "Service role can manage launch checklist items" on public.launch_checklist_items;
drop policy if exists "Service role can manage launch beta accounts" on public.launch_beta_accounts;
drop policy if exists "Service role can manage launch status snapshots" on public.launch_status_snapshots;
drop policy if exists "Members can read workspace daily goals" on public.workspace_daily_goals;
drop policy if exists "Admins can manage workspace daily goals" on public.workspace_daily_goals;

create policy "Service role can manage launch readiness categories"
  on public.launch_readiness_categories for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "Service role can manage launch provider status"
  on public.launch_provider_status for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "Service role can manage launch blockers"
  on public.launch_blockers for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "Service role can manage launch checklist items"
  on public.launch_checklist_items for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "Service role can manage launch beta accounts"
  on public.launch_beta_accounts for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "Service role can manage launch status snapshots"
  on public.launch_status_snapshots for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "Members can read workspace daily goals"
  on public.workspace_daily_goals for select
  using (public.is_workspace_member(workspace_id));

create policy "Admins can manage workspace daily goals"
  on public.workspace_daily_goals for all
  using (public.is_workspace_admin(workspace_id))
  with check (public.is_workspace_admin(workspace_id));

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

create index if not exists launch_readiness_categories_status_idx
  on public.launch_readiness_categories(status, category_key);

create index if not exists launch_checklist_items_status_idx
  on public.launch_checklist_items(status, required);

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
