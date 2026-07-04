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
  status text not null default 'new' check (status in ('new', 'reviewed', 'converted')),
  converted_lead_id uuid references public.leads(id) on delete set null,
  reviewed_at timestamptz,
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
  seat_limit integer not null default 3 check (seat_limit > 0),
  trial_ends_at timestamptz default (now() + interval '14 days'),
  current_period_end timestamptz,
  stripe_customer_id text,
  stripe_subscription_id text,
  updated_at timestamptz not null default now()
);

create table if not exists public.workspace_invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  email text not null,
  role text not null default 'member' check (role in ('admin', 'member')),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked')),
  invite_token_hash text,
  expires_at timestamptz,
  accepted_at timestamptz,
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

alter table if exists public.workspace_subscriptions
  add column if not exists current_period_end timestamptz,
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text;

alter table if exists public.workspace_subscriptions
  alter column trial_ends_at drop not null;

alter table if exists public.workspace_invitations
  add column if not exists invite_token_hash text,
  add column if not exists expires_at timestamptz,
  add column if not exists accepted_at timestamptz;

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
alter table public.workspace_invitations enable row level security;
alter table public.workspace_audit_events enable row level security;

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

revoke execute on function public.is_workspace_member(uuid) from public;
revoke execute on function public.is_workspace_member(uuid) from anon;
grant execute on function public.is_workspace_member(uuid) to authenticated;

revoke execute on function public.is_workspace_owner(uuid) from public;
revoke execute on function public.is_workspace_owner(uuid) from anon;
grant execute on function public.is_workspace_owner(uuid) to authenticated;

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
drop policy if exists "Members can read leads" on public.leads;
drop policy if exists "Members can insert leads" on public.leads;
drop policy if exists "Members can update leads" on public.leads;
drop policy if exists "Members can delete leads" on public.leads;
drop policy if exists "Members can manage tasks" on public.tasks;
drop policy if exists "Members can manage automations" on public.automations;
drop policy if exists "Members can manage activities" on public.activities;
drop policy if exists "Members can manage recruiting candidates" on public.recruiting_candidates;
drop policy if exists "Members can manage subscriptions" on public.workspace_subscriptions;
drop policy if exists "Members can manage invitations" on public.workspace_invitations;
drop policy if exists "Invited users can read their own pending invitations" on public.workspace_invitations;
drop policy if exists "Members can manage audit events" on public.workspace_audit_events;

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
        and lower(invitation.email) = lower(auth.email())
        and invitation.status = 'pending'
        and (invitation.expires_at is null or invitation.expires_at > now())
    )
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

create policy "Members can delete leads"
  on public.leads for delete
  using (public.is_workspace_member(workspace_id));

create policy "Members can manage tasks"
  on public.tasks for all
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy "Members can manage automations"
  on public.automations for all
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy "Members can manage activities"
  on public.activities for all
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy "Members can manage recruiting candidates"
  on public.recruiting_candidates for all
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy "Members can manage subscriptions"
  on public.workspace_subscriptions for all
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy "Members can manage invitations"
  on public.workspace_invitations for all
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy "Invited users can read their own pending invitations"
  on public.workspace_invitations for select
  using (
    lower(email) = lower(auth.email())
    and status = 'pending'
    and (expires_at is null or expires_at > now())
  );

create policy "Members can manage audit events"
  on public.workspace_audit_events for all
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));
