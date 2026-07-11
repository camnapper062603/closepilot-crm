# Google Token Migration

Google Calendar tokens must be encrypted before live OAuth connects.

## Required Environment

```text
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
GOOGLE_TOKEN_ENCRYPTION_KEY=<32 bytes as utf8, base64, or 64-char hex>
GOOGLE_TOKEN_ENCRYPTION_KEY_VERSION=v1
```

## Migration Flow

1. Apply `supabase/migrations/20260711_security_hardening.sql`.
2. Dry run existing rows:

```bash
npm run security:encrypt-google-tokens -- --dry-run
```

3. Encrypt rows:

```bash
npm run security:encrypt-google-tokens
```

4. Verify:

```bash
npm run security:encrypt-google-tokens -- --verify
npm run security:check-plaintext-tokens
```

5. Clear legacy plaintext values after live Calendar status/events are verified:

```bash
npm run security:encrypt-google-tokens -- --clear-plaintext
```

6. In a later guarded release, apply `supabase/migrations/20260711_drop_legacy_google_plaintext_tokens.sql`. It refuses to drop plaintext columns if any row still has plaintext token values.

## Safety Rules

- Do not run the guarded drop migration before the plaintext checker passes.
- Do not paste live token values into issues, logs, or screenshots.
- Rotate `GOOGLE_TOKEN_ENCRYPTION_KEY` only with a planned re-encryption process.
