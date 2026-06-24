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
  role text not null default 'owner' check (role in ('owner', 'admin', 'member')),
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

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.leads enable row level security;
alter table public.tasks enable row level security;
alter table public.automations enable row level security;

create policy "Users can see their workspaces"
  on public.workspaces for select
  using (id in (select workspace_id from public.workspace_members where user_id = auth.uid()));

create policy "Users can create owned workspaces"
  on public.workspaces for insert
  with check (owner_id = auth.uid());

create policy "Owners can update workspaces"
  on public.workspaces for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "Users can see workspace members"
  on public.workspace_members for select
  using (user_id = auth.uid());

create policy "Users can add themselves to owned workspaces"
  on public.workspace_members for insert
  with check (
    user_id = auth.uid()
    and workspace_id in (select id from public.workspaces where owner_id = auth.uid())
  );

create policy "Members can read leads"
  on public.leads for select
  using (workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid()));

create policy "Members can insert leads"
  on public.leads for insert
  with check (workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid()));

create policy "Members can update leads"
  on public.leads for update
  using (workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid()))
  with check (workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid()));

create policy "Members can delete leads"
  on public.leads for delete
  using (workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid()));

create policy "Members can manage tasks"
  on public.tasks for all
  using (workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid()))
  with check (workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid()));

create policy "Members can manage automations"
  on public.automations for all
  using (workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid()))
  with check (workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid()));
