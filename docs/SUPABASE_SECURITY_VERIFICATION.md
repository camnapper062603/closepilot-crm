# Supabase Security Verification

The live verifier is intentionally read-only and does not print secrets.

```bash
npm run security:verify-migration
npm run security:verify-migration -- --json
```

It checks:

- Google Calendar encrypted token columns.
- Optional `calendar_connection_status` view.
- Kira Recruit app-state table.
- Kira Recruit candidate handoff columns.
- Workspace add-on table.
- Sampled plaintext Google token state.

If `SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` is missing, the script exits with status `2` and reports `not_configured`.

## GitHub Actions

`.github/workflows/supabase-security-verify.yml` is manual only. Store the following secrets in the selected GitHub environment:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Run it after applying Supabase migrations and before declaring a beta database ready.
