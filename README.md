# ClosePilot CRM

ClosePilot is a hosted MVP CRM for a personal sales workflow now and a SaaS product later.

## Run Locally

Open `index.html` directly in Chrome, or use a local static server:

```bash
npm start
```

Then visit:

```text
http://localhost:4173
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

This MVP stores CRM data in the browser with `localStorage`. That makes it fast and easy to host, but the data stays on the device/browser that entered it.

## Next SaaS Milestone

To turn this from a hosted MVP into a real multi-user SaaS product, add:

- User signup/login
- Cloud database
- Workspaces/accounts
- Server-side permissions
- Email/calendar integrations
- Stripe billing

Supabase plus Vercel is the best next stack for this app.
