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

## Deploy On Netlify

1. Create a GitHub repository for this folder.
2. Push the project to GitHub.
3. Go to Netlify and choose **Add new site**.
4. Import the GitHub repository.
5. Use these settings:
   - Build command: leave blank
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
