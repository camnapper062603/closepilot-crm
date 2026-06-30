# Safe Property Lead Generator Setup

This MVP builds property leads from deed/property CSVs, contact enrichment CSVs, and DNC/opt-out suppression files.

It does not scrape restricted registries. Use official exports, licensed providers, county bulk downloads, or files you are authorized to use.

## Open The App

If the local server is running:

```text
http://127.0.0.1:4173/SafeLeadGenerator.html
```

If not, run:

```bash
npm start
```

Then open the same URL.

## Required Workflow

1. Import deed/property records.
2. Import contact enrichment records.
3. Import federal DNC suppression data.
4. Import state DNC suppression data.
5. Import internal opt-outs if you have them.
6. Click `Generate safe leads`.
7. Export only the `Safe Lead Output`.

Phone-capable leads are blocked unless both federal and state DNC files have been loaded.

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
