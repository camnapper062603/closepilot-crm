-- Security hardening for ClosePilot / Kira Home production API access.
-- Run after the base supabase-schema.sql. This migration is additive and safe to rerun.

alter table if exists public.calendar_connections
  add column if not exists access_token_ciphertext text not null default '',
  add column if not exists access_token_iv text not null default '',
  add column if not exists access_token_tag text not null default '',
  add column if not exists refresh_token_ciphertext text not null default '',
  add column if not exists refresh_token_iv text not null default '',
  add column if not exists refresh_token_tag text not null default '',
  add column if not exists token_key_version text not null default 'v1',
  add column if not exists last_sync_at timestamptz;

comment on column public.calendar_connections.access_token is
  'Legacy plaintext token column. New writes store encrypted tokens in access_token_ciphertext/access_token_iv/access_token_tag.';
comment on column public.calendar_connections.refresh_token is
  'Legacy plaintext token column. New writes store encrypted tokens in refresh_token_ciphertext/refresh_token_iv/refresh_token_tag.';

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

drop policy if exists "Members can read calendar connections" on public.calendar_connections;
drop policy if exists "Admins can manage calendar connections" on public.calendar_connections;

create policy "Members can read calendar connection status"
  on public.calendar_connections for select
  using (public.is_workspace_member(workspace_id));

create policy "Service role manages calendar connections"
  on public.calendar_connections for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
