# Supabase Setup

1. Create a Supabase project.
2. Copy the Project URL, anon/publishable key, and service role key.
3. Add them to Vercel as `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.
4. Open Supabase SQL Editor.
5. Paste and run `supabase-schema.sql`.
6. In Supabase Auth URL Configuration, set:
   - Site URL: `https://closepilot-crm.vercel.app`
   - Redirect URL: `https://closepilot-crm.vercel.app`

The schema is idempotent and includes tables, indexes, and RLS policies for workspaces, leads, tasks, activities, recruiting, communications, AI outputs, files, jobs, billing, invitations, settings, and audit logs.

First signed-in user becomes workspace `owner`.
