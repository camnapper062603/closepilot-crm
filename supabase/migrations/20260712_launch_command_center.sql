create extension if not exists pgcrypto;

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
