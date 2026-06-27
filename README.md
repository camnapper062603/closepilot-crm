# ClosePilot CRM

ClosePilot is a hosted MVP CRM for a personal sales workflow now and a SaaS product later.

## Run Locally

Use the local static server:

```bash
npm start
```

Then visit:

```text
http://localhost:4173
```

If that port is already busy, run another port:

```bash
PORT=4174 npm start
```

## Test

```bash
npm test
```

## Deploy On Vercel

1. Create a GitHub repository for this folder.
2. Push the project to GitHub.
3. Go to Vercel and choose **Add New Project**.
4. Import the GitHub repository.
5. Use these settings:
   - Framework Preset: **Other**
   - Build Command: leave blank
   - Output Directory: `.`
6. Deploy.

## Supabase Setup

1. Create a Supabase project.
2. Open the SQL editor.
3. Run the contents of `supabase-schema.sql`.
4. Copy your Project URL and anon public key.
5. In Netlify, add environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
6. Redeploy the site.
7. In Supabase Auth URL Configuration, set:
   - Site URL: your Netlify URL
   - Redirect URL: your Netlify URL

Without those variables, the app runs in demo mode using browser storage.

## Deploy On Netlify

1. Create a GitHub repository for this folder.
2. Push the project to GitHub.
3. Go to Netlify and choose **Add new site**.
4. Import the GitHub repository.
5. Use these settings:
   - Build command: `npm run build`
   - Publish directory: `.`
6. Deploy.

## What This Version Stores

Without Supabase environment variables, the app runs in demo mode and stores CRM/account data in the browser with `localStorage`. With Supabase configured, leads, tasks, automations, activity, workspace members, subscription state, and invitations can sync to the cloud.

## SaaS Foundation Included

This build includes:

- User signup/login through Supabase Auth
- Workspace/account setup
- Team members and staged invitations
- Plan/seat management for Starter, Growth, and Scale
- Supabase schema and RLS policies for CRM data, subscriptions, and invitations
- CRM pipeline, contacts, tasks, automations, activity, CSV import/export, backups, revenue goals, and channel reporting

Production billing still needs a Stripe checkout/customer portal integration, and real invitation delivery still needs an email provider.
