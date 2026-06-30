# Safe Property Lead Generator Setup

This MVP builds property leads from deed/property CSVs, contact enrichment CSVs, and DNC/opt-out suppression files.

It does not scrape restricted registries. Use official exports, licensed providers, county bulk downloads, or files you are authorized to use.

## Open The App

Standalone one-file version:

```text
SafeLeadGenerator-Standalone.html
```

You can open that file directly in Chrome. It has built-in template downloads and does not need the template folder.

If the local server is running:

```text
http://127.0.0.1:4173/SafeLeadGenerator.html
```

If not, run:

```bash
npm start
```

Then open the same URL.

For the standalone file on the local server:

```text
http://127.0.0.1:4173/SafeLeadGenerator-Standalone.html
```

## Share With 100+ People

Use `SafeLeadGenerator-Standalone.html` for the first team rollout.

The app runs in each person's browser. That means:

- no one needs Node installed
- everyone can use the same hosted URL
- uploaded CSVs stay in that user's browser during the session
- exports download to that user's computer
- there are no shared accounts, shared history, or central database in this version

To turn on GitHub Pages without Netlify:

1. Open the GitHub repo.
2. Go to `Settings > Pages`.
3. Under `Build and deployment`, set `Source` to `Deploy from a branch`.
4. Set `Branch` to `main`.
5. Set the folder to `/root`.
6. Click `Save`.
7. Wait a minute or two, then open:

```text
https://camnapper062603.github.io/closepilot-crm/SafeLeadGenerator-Standalone.html
```

For true SaaS access with employee/user accounts, saved imports, team permissions, audit history, and shared exports, the next build should use Supabase auth + database + storage instead of a pure HTML file.

## Automation Mode

Use this when you want the workflow to run from files instead of clicking through the browser app.

Put these files in `lead-generator-imports/`:

```text
property-records.csv
contact-enrichment.csv
federal-dnc.csv
state-dnc.csv
internal-opt-outs.csv
```

`internal-opt-outs.csv` is optional, but the other four files are required for phone-capable lead generation.

Then run:

```bash
npm run lead:generate
```

Outputs are written to:

```text
lead-generator-outputs/safe-leads.csv
lead-generator-outputs/suppression-audit.csv
lead-generator-outputs/run-summary.json
```

You can control a run with environment variables:

```bash
MIN_CONFIDENCE=80 CHANNEL=any DNC_MAX_DAYS=30 SCRUB_DATE=2026-06-30 npm run lead:generate
```

Supported channels:

```text
any
phone
email
mail
```

The import and output folders are ignored by Git so private lead/contact data does not get pushed to GitHub.

## Required Workflow

1. Get authorized deed/property records.
2. Get licensed contact enrichment records.
3. Get your federal DNC suppression export from your authorized telemarketer registry account.
4. Get required state DNC suppression exports for the states you market in.
5. Export your internal opt-outs if you have them.
6. Open `SafeLeadGenerator-Standalone.html`.
7. Use `Bulk import all CSVs` and select all required CSV files at once.
8. Click `Generate safe leads`.
9. Export only the `Safe Lead Output`.

Phone-capable leads are blocked unless both federal and state DNC files have been loaded.

## Required CSV Sources

Use files you are authorized to access:

- Property/deed records: county recorder, county assessor, county bulk data portal, or a licensed property data provider.
- Contact enrichment: licensed skip trace/contact provider with source and confidence fields.
- Federal DNC: official telemarketer access at `telemarketing.donotcall.gov`.
- State DNC: state consumer protection/attorney general list access, or a compliance vendor covering your target states.
- Internal opt-outs: your own do-not-contact list from calls, texts, emails, forms, CRM notes, and unsubscribe requests.

Do not upload scraped phone/email data unless you have confirmed the source and your outreach use are lawful.

## FTC Do Not Call Data Page

The FTC Open Government Do Not Call data page is useful for research, trend analysis, and complaint context, but it is not the official suppression list to scrub your leads against.

Use the official telemarketer registry portal for federal DNC suppression files:

```text
https://telemarketing.donotcall.gov/
```

Treat the FTC open data page as reference data only unless your attorney/compliance vendor tells you otherwise.

## Candidate Leads Before DNC Scrub

If you only have property records and contact enrichment, the app can generate lead candidates that still need suppression review:

1. Bulk import `property-records.csv`.
2. Bulk import `contact-enrichment.csv`.
3. Set `Allowed outreach` to `Candidate list - needs DNC scrub`.
4. Click `Generate safe leads`.
5. Export `lead-candidates-needs-scrub.csv`.

Candidate rows are not contact-ready. Do not call, text, or otherwise use phone numbers from that file until federal DNC, state DNC, internal opt-out, and consent checks are complete.

## Automated Lead Workflow

The standalone app now auto-scrubs property and contact enrichment imports.

When `Auto scrub and generate` is checked:

1. Import property records and contact enrichment.
2. The app normalizes names, addresses, phones, emails, states, zips, and confidence scores.
3. Duplicate property and contact rows are removed.
4. Invalid property/contact rows are dropped.
5. Lead candidates are generated automatically and marked `needs-scrub`.
6. Import federal DNC, state DNC, and internal opt-out files.
7. The app automatically re-generates the list as safe leads when the DNC scrub date is fresh.

Your ongoing manual job should be keeping these files current:

```text
federal-dnc.csv
state-dnc.csv
internal-opt-outs.csv
```

After those files are imported, export `safe-leads.csv`. If DNC files are missing or stale, export only `lead-candidates-needs-scrub.csv`.

## Apollo + Hunter Business Enrichment

The public HTML does not store Apollo or Hunter API keys. Keys must live in a backend environment.

Backend endpoint added:

```text
/api/business-enrichment
```

Required backend environment variables:

```text
APOLLO_API_KEY=your_apollo_key
HUNTER_API_KEY=your_hunter_key
ENRICHMENT_CLIENT_TOKEN=your_team_access_token
ENRICHMENT_ALLOWED_ORIGIN=https://camnapper062603.github.io
```

How it works:

1. The app sends business domains, titles, and locations to `/api/business-enrichment`.
2. The backend calls Apollo People Search for business people/company context.
3. The backend calls Hunter Domain Search for business emails.
4. The public HTML imports returned records as business lead candidates.
5. Those leads are marked `needs-scrub` until DNC/state/internal suppression checks are loaded.

Frontend workflow:

1. Deploy the backend somewhere that supports Node API routes, such as Vercel.
2. Add the environment variables above in that backend host.
3. Open the live app.
4. Paste your backend endpoint into `Backend URL`, for example:

```text
https://your-project.vercel.app/api/business-enrichment
```

5. Enter the `Backend access token`.
6. Enter business domains, titles, and locations.
7. Click `Run Apollo + Hunter`.

Notes:

- This uses official Apollo/Hunter APIs, not scraping.
- Apollo API access depends on your Apollo plan.
- Hunter credits are used for domain/email lookups.
- Keep all Apollo/Hunter results in `needs-scrub` status until DNC and consent checks are complete.

## Pulling Property Records

The app can pull property records directly from authorized open-data sources when the source allows browser access.

Supported source types:

- `CSV URL`: a direct public or signed CSV download URL.
- `ArcGIS MapServer/FeatureServer layer`: a public ArcGIS REST layer URL ending in a layer number, such as `/MapServer/0` or `/FeatureServer/0`.

Workflow:

1. Find an authorized county/assessor/property data source.
2. Copy the direct CSV URL or ArcGIS FeatureServer layer URL.
3. Paste it into `Property source URL`.
4. Choose `CSV URL` or `ArcGIS MapServer/FeatureServer layer`.
5. Click `Pull property records`.

The app then cleans, dedupes, and imports those property records automatically.

For Harris County:

1. Click `Use Harris County HCAD`.
2. Adjust `Max records` if needed.
3. Click `Pull property records`.

The preset uses HCAD's public parcel ArcGIS service:

```text
https://www.gis.hctx.net/arcgis/rest/services/HCAD/Parcels/MapServer/0
```

Limits:

- Some county sites block browser access with CORS. If that happens, download the CSV manually or build a backend connector.
- Some county portals require accounts, paid access, captchas, or terms that prohibit scraping.
- For fully automated county-by-county pulling, build backend source adapters for the exact counties and providers you use.

## Free Residential Workaround

This is the most automated free path for residential roofing/home-improvement leads:

1. Open `SafeLeadGenerator-Standalone.html`.
2. Click `Use Harris County HCAD` or paste another authorized county ArcGIS/CSV source.
3. Click `Pull property records`.
4. Click `Generate residential mail leads`.
5. Export `residential-mail-leads.csv`.

Those rows are built from property records only and are intended for postal mail, door-hanger planning, canvassing routes, or later paid enrichment.

The app intentionally leaves `phone` and `email` blank in this mode. Before calling, texting, or emailing those homeowners, run the records through a licensed enrichment provider and then import fresh federal DNC, Texas/state DNC, and internal opt-out files.

Good free automation:

- public county/appraisal district property data
- owner names
- property and mailing addresses
- residential filtering
- postal/mail-ready lead export

Not realistically free at scale:

- accurate homeowner mobile numbers
- accurate homeowner personal emails
- automatic federal/state DNC list access
- TCPA consent validation

For phone/email outreach, use a paid provider that allows your intended marketing use, keeps source/confidence fields, and can support compliance review.

## DNC List Access

Federal DNC telemarketer registration and subscription:

```text
https://telemarketing.donotcall.gov/profile/create.aspx
```

Federal DNC main portal:

```text
https://telemarketing.donotcall.gov/
```

Texas No Call official site:

```text
https://www.texasnocall.com/
```

Texas telemarketer registration is linked from the official site as:

```text
https://www.texasnocall.com/default.asp?goto=telemarketer.asp
```

If the direct Texas registration link shows an error, open the main Texas No Call site first and click `Telemarketer Registration`. The Texas site also has a renewal link:

```text
https://www.texasnocall.com/default.asp?goto=searchRenewal.asp
```

Texas publishes its lists quarterly and says telemarketers can pay by credit card through the website. Keep proof of every DNC download/import with your exported leads.

## Bulk Import File Names

The standalone app can auto-sort files by filename and headers. These names are recommended:

```text
property-records.csv
contact-enrichment.csv
federal-dnc.csv
state-dnc.csv
internal-opt-outs.csv
```

If a state has no separate DNC rows for your use case, upload a CSV named `state-dnc.csv` with this header:

```csv
phone,state
```

## Template Files

Download templates from the app sidebar or use these local files:

- `lead-generator-templates/property-records-template.csv`
- `lead-generator-templates/contact-enrichment-template.csv`
- `lead-generator-templates/federal-dnc-template.csv`
- `lead-generator-templates/state-dnc-template.csv`
- `lead-generator-templates/internal-opt-outs-template.csv`

To import:

1. Open `SafeLeadGenerator.html`.
2. Click the matching file picker under `CSV Imports`.
3. Select the CSV with matching headers.
4. Confirm the count updates in the dashboard.
5. Click `Generate safe leads` after all required imports are loaded.

If a state has no separate list for your use case, upload an empty CSV with this header so the app records that the state DNC check was reviewed:

```csv
phone,state
```

## Property CSV

Supported columns include:

```text
owner_name
property_address
property_city
property_state
property_zip
mailing_address
mailing_city
mailing_state
mailing_zip
sale_date
assessed_value
acreage
county
parcel_id
```

Alternate headers such as `owner`, `grantee`, `situs_address`, `site_address`, `apn`, and `pin` are also handled.

## Contact Enrichment CSV

Supported columns include:

```text
owner_name
mailing_address
property_address
phone
phone2
email
email2
confidence
source
```

Use contact data only from a lawful source or licensed enrichment provider. The app keeps the `source` field in the exported lead rows.

## Federal DNC CSV

Supported columns:

```text
phone
```

Alternate headers `number` and `telephone` are also handled.

## State DNC CSV

Supported columns:

```text
phone
state
```

If `state` is blank, the app treats the phone as blocked for all states.

## Internal Opt-Out CSV

Supported columns:

```text
phone
email
reason
```

Internal opt-outs always override enrichment data.

## Export Rules

`Safe Lead Output` can include:

- `phone` only when federal DNC, state DNC, and internal opt-out checks pass
- `email` only when the email is not on the internal opt-out list
- `postal` when a mailing/property address exists

`Suppression Audit` shows blocked phone rows with the matching list and reason.

## Compliance Notes

- Keep a copy of every suppression file and export date.
- Re-scrub phone numbers on the cadence required for your campaign and jurisdiction.
- Do not use this to send automated calls or texts without confirming consent requirements.
- Keep a business opt-out list and honor it before any outreach.
