create table if not exists public.operational_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'unknown',
  operation text not null default 'unknown',
  workspace_id uuid references public.workspaces(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  resource_type text not null default '',
  resource_id text not null default '',
  safe_error_code text not null default 'UNKNOWN',
  outcome text not null default 'failed',
  retryable boolean not null default false,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  occurrence_count integer not null default 1 check (occurrence_count >= 1),
  resolved boolean not null default false,
  request_id text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.operational_events enable row level security;

create index if not exists operational_events_workspace_last_seen_idx
  on public.operational_events(workspace_id, last_seen_at desc);

create index if not exists operational_events_provider_outcome_idx
  on public.operational_events(provider, outcome, resolved, last_seen_at desc);

drop policy if exists "Service role can manage operational events" on public.operational_events;
drop policy if exists "Workspace admins can read operational events" on public.operational_events;

create policy "Service role can manage operational events"
  on public.operational_events for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "Workspace admins can read operational events"
  on public.operational_events for select
  using (workspace_id is not null and public.is_workspace_admin(workspace_id));
