# MOJO Sheets Connector Setup

This is the safe connector path for MOJO lead data. It does not scrape MOJO's private app pages.

## What It Does

- Creates a Google Sheet lead table.
- Imports exported/pasted MOJO rows.
- Imports copied house/detail panel text.
- Accepts authorized JSON webhook rows from API Nation, Zapier, Make, or another connector.
- Normalizes names, addresses, phones, emails, status, tags, and notes.
- Upserts by MOJO lead ID when available, or by a generated stable ID.

## Files

Use:

```text
mojo-sheets-connector-appscript.gs
```

Do not paste this into the same Apps Script project as the employee-hours tracker unless you rename duplicate functions like `onOpen`.

## Sheet Setup

1. Create a new Google Sheet for MOJO leads.
2. Go to `Extensions > Apps Script`.
3. Paste `mojo-sheets-connector-appscript.gs` into `Code.gs`.
4. Save.
5. Run `setupMojoConnector`.
6. Approve permissions.
7. Reload the Sheet.
8. Use the `MOJO Connector` menu.

The script creates:

- `MOJO Settings`
- `MOJO CSV Paste`
- `MOJO Detail Paste`
- `MOJO Leads`
- `MOJO Raw Imports`
- `MOJO Import Log`

## Manual Export Workflow

1. Export leads from MOJO using its allowed export/download tools.
2. Open the `MOJO CSV Paste` tab.
3. Paste the exported rows, including headers, starting in cell A1.
4. Click `MOJO Connector > Import pasted/exported rows`.
5. Review the normalized leads in `MOJO Leads`.

## Faster Click-And-Copy Workflow

I cannot provide a script that hooks into MOJO's private page after each house icon click. This workflow is the safe version that still saves most of the manual typing:

1. In MOJO, manually click a house icon.
2. Select/copy the visible house or lead detail text.
3. Paste that copied text into the `MOJO Detail Paste` tab.
4. Put each copied house/detail block in its own row, or separate blocks with blank lines.
5. Click `MOJO Connector > Import copied detail text`.
6. Review the normalized leads in `MOJO Leads`.

The parser looks for common labels and patterns, including:

- `Name:`
- `Owner:`
- `Address:`
- `City:`
- `State:`
- `Zip:`
- `Phone:`
- `Email:`
- `Status:`
- `Tags:`
- `Notes:`

It also tries to detect unlabeled phone numbers, email addresses, street addresses, and `TX 77000` style state/ZIP lines.

## Webhook Workflow

1. Deploy the Apps Script as a Web App.
2. Set access according to your connector needs.
3. Run `MOJO Connector > Show webhook info`.
4. Copy the URL with `?token=...`.
5. Configure API Nation, Zapier, Make, or your authorized connector to POST JSON rows to that URL.

Accepted JSON formats:

```json
{
  "leads": [
    {
      "lead_id": "12345",
      "contact_name": "Maya Johnson",
      "property_address": "1840 Northstar Dr",
      "property_city": "Austin",
      "property_state": "TX",
      "property_zip": "78731",
      "phone": "512-555-0184",
      "email": "maya@example.com",
      "status": "New",
      "tags": "roofing, homeowner",
      "notes": "Imported from authorized connector"
    }
  ]
}
```

or a single lead object.

## Supported Fields

The importer understands common field names:

- `lead_id`, `id`, `mojo_id`, `contact_id`
- `contact_name`, `name`, `full_name`, `owner_name`
- `first_name`, `last_name`
- `property_address`, `address`, `street_address`, `street`
- `property_city`, `city`
- `property_state`, `state`
- `property_zip`, `zip`, `zipcode`
- `mailing_address`, `owner_address`
- `phone`, `phone1`, `primary_phone`, `mobile`, `cell`
- `phone2`, `secondary_phone`
- `email`, `email1`, `email_address`
- `status`, `lead_status`, `disposition`
- `tags`, `campaign`
- `notes`, `comments`

## Important

This connector is for data you are authorized to export or sync. It is not a scraper for MOJO's private UI and does not hook into MOJO page clicks.
