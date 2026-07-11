do $$
declare
  plaintext_count integer;
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'calendar_connections'
      and column_name = 'access_token_ciphertext'
  ) then
    raise exception 'Encrypted Google token columns are missing. Run the security hardening migration first.';
  end if;

  select count(*)
    into plaintext_count
  from public.calendar_connections
  where coalesce(access_token, '') <> ''
     or coalesce(refresh_token, '') <> '';

  if plaintext_count > 0 then
    raise exception 'Refusing to drop plaintext Google token columns while % row(s) still contain plaintext tokens.', plaintext_count;
  end if;

  alter table public.calendar_connections
    drop column if exists access_token,
    drop column if exists refresh_token;
end $$;
