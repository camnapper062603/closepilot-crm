/**
 * MOJO to Google Sheets Connector.
 *
 * Safe supported workflows:
 * 1. Export/download leads from MOJO, paste them into "MOJO CSV Paste",
 *    then run "MOJO Connector > Import pasted/exported rows".
 * 2. Deploy this Apps Script as a Web App and send authorized JSON rows
 *    from API Nation, Zapier, Make, or another connector to doPost().
 *
 * This does not scrape MOJO's private app UI.
 */

const MOJO_CONNECTOR = {
  sheets: {
    settings: "MOJO Settings",
    paste: "MOJO CSV Paste",
    leads: "MOJO Leads",
    raw: "MOJO Raw Imports",
    log: "MOJO Import Log",
  },
  headers: {
    settings: ["Setting", "Value", "Notes"],
    paste: ["Paste exported MOJO columns here, then run Import pasted/exported rows"],
    leads: [
      "Lead ID",
      "Imported At",
      "Source",
      "Contact Name",
      "First Name",
      "Last Name",
      "Property Address",
      "Property City",
      "Property State",
      "Property Zip",
      "Mailing Address",
      "Phone",
      "Phone 2",
      "Email",
      "Status",
      "Tags",
      "Notes",
      "Last Updated",
      "Raw JSON",
    ],
    raw: ["Timestamp", "Source", "Record Count", "Payload JSON"],
    log: ["Timestamp", "Action", "Message"],
  },
};

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("MOJO Connector")
    .addItem("Setup connector", "setupMojoConnector")
    .addItem("Import pasted/exported rows", "importMojoPasteSheet")
    .addItem("Generate new webhook token", "generateMojoWebhookToken")
    .addItem("Show webhook info", "showMojoWebhookInfo")
    .addToUi();
}

function doGet() {
  return ContentService.createTextOutput(JSON.stringify({ ok: true, app: "MOJO Sheets Connector" })).setMimeType(
    ContentService.MimeType.JSON,
  );
}

function doPost(e) {
  return runMojoSafely_("doPost", () => {
    setupMojoConnector(false);
    const token = String((e && e.parameter && e.parameter.token) || "").trim();
    const expectedToken = getMojoSetting_("Webhook Token");

    if (!expectedToken || token !== expectedToken) {
      return jsonMojoResponse_({ ok: false, error: "Unauthorized. Missing or invalid token." }, 401);
    }

    const text = e && e.postData && e.postData.contents ? e.postData.contents : "";
    if (!text) return jsonMojoResponse_({ ok: false, error: "Missing JSON body." }, 400);

    const payload = JSON.parse(text);
    const rows = Array.isArray(payload) ? payload : Array.isArray(payload.leads) ? payload.leads : [payload];
    const result = importMojoRows_(rows, "Webhook");

    return jsonMojoResponse_({ ok: true, ...result });
  });
}

function setupMojoConnector(showAlert = true) {
  const ss = SpreadsheetApp.getActive();

  Object.keys(MOJO_CONNECTOR.sheets).forEach((key) => {
    const sheet = ensureMojoSheet_(ss, MOJO_CONNECTOR.sheets[key]);
    setMojoHeader_(sheet, MOJO_CONNECTOR.headers[key]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, Math.max(1, MOJO_CONNECTOR.headers[key].length)).setFontWeight("bold").setBackground("#0f766e").setFontColor("#ffffff");
  });

  seedMojoSettings_();
  ss.getSheetByName(MOJO_CONNECTOR.sheets.leads).autoResizeColumns(1, MOJO_CONNECTOR.headers.leads.length);
  logMojo_("Setup", "MOJO connector is ready.");

  if (showAlert) SpreadsheetApp.getUi().alert("MOJO connector is ready. Paste exported rows into MOJO CSV Paste or deploy as a webhook.");
}

function importMojoPasteSheet() {
  runMojoSafely_("importMojoPasteSheet", () => {
    setupMojoConnector(false);
    const sheet = SpreadsheetApp.getActive().getSheetByName(MOJO_CONNECTOR.sheets.paste);
    const values = sheet.getDataRange().getValues();

    if (values.length < 2) {
      SpreadsheetApp.getUi().alert("Paste exported MOJO rows into the MOJO CSV Paste tab first.");
      return;
    }

    const rows = rowsFromPasteValues_(values);

    const result = importMojoRows_(rows, "Paste/CSV Export");
    SpreadsheetApp.getUi().alert(`Imported ${result.inserted} new lead(s), updated ${result.updated}, skipped ${result.skipped}.`);
  });
}

function rowsFromPasteValues_(values) {
  const singleColumnCsv = values[0].length === 1 && String(values[0][0] || "").includes(",");
  const table = singleColumnCsv ? Utilities.parseCsv(values.map((row) => row[0]).join("\n")) : values;
  const headers = table[0].map(normalizeMojoHeader_);

  return table
    .slice(1)
    .filter((row) => row.some((cell) => String(cell || "").trim()))
    .map((row) =>
      headers.reduce((record, header, index) => {
        record[header] = row[index];
        return record;
      }, {}),
    );
}

function importMojoRows_(rows, source) {
  const normalized = rows.map((row) => normalizeMojoLead_(row, source)).filter((lead) => lead.contactName || lead.propertyAddress || lead.phone || lead.email);
  const leadSheet = SpreadsheetApp.getActive().getSheetByName(MOJO_CONNECTOR.sheets.leads);
  const existingIndex = getMojoLeadIndex_(leadSheet);
  const now = new Date();
  let inserted = 0;
  let updated = 0;
  let skipped = rows.length - normalized.length;

  normalized.forEach((lead) => {
    const output = mojoLeadToRow_(lead, now);
    const existingRow = existingIndex[lead.leadId];

    if (existingRow) {
      leadSheet.getRange(existingRow, 1, 1, output.length).setValues([output]);
      updated += 1;
    } else {
      leadSheet.getRange(leadSheet.getLastRow() + 1, 1, 1, output.length).setValues([output]);
      inserted += 1;
    }
  });

  appendMojoRows_(SpreadsheetApp.getActive().getSheetByName(MOJO_CONNECTOR.sheets.raw), [
    [now, source, normalized.length, JSON.stringify(rows).slice(0, 45000)],
  ]);
  logMojo_("Import", `Source ${source}: inserted ${inserted}, updated ${updated}, skipped ${skipped}.`);

  return { received: rows.length, normalized: normalized.length, inserted, updated, skipped };
}

function normalizeMojoLead_(row, source) {
  const firstName = cleanMojoText_(readMojoField_(row, ["first_name", "firstname", "first"]));
  const lastName = cleanMojoText_(readMojoField_(row, ["last_name", "lastname", "last"]));
  const contactName =
    cleanMojoText_(readMojoField_(row, ["contact_name", "name", "full_name", "owner_name", "lead_name"])) ||
    [firstName, lastName].filter(Boolean).join(" ");
  const propertyAddress = cleanMojoText_(readMojoField_(row, ["property_address", "address", "street_address", "street", "home_address"]));
  const propertyCity = cleanMojoText_(readMojoField_(row, ["property_city", "city", "home_city"]));
  const propertyState = cleanMojoState_(readMojoField_(row, ["property_state", "state", "home_state"]));
  const propertyZip = cleanMojoZip_(readMojoField_(row, ["property_zip", "zip", "zipcode", "postal_code"]));
  const mailingAddress = cleanMojoText_(readMojoField_(row, ["mailing_address", "mail_address", "owner_address"]));
  const phone = formatMojoPhone_(readMojoField_(row, ["phone", "phone1", "primary_phone", "mobile", "cell", "telephone"]));
  const phone2 = formatMojoPhone_(readMojoField_(row, ["phone2", "secondary_phone", "alternate_phone"]));
  const email = cleanMojoEmail_(readMojoField_(row, ["email", "email1", "email_address"]));
  const externalId = cleanMojoText_(readMojoField_(row, ["lead_id", "id", "mojo_id", "contact_id", "record_id"]));
  const status = cleanMojoText_(readMojoField_(row, ["status", "lead_status", "disposition"]));
  const tags = cleanMojoText_(readMojoField_(row, ["tags", "tag", "groups", "campaign"]));
  const notes = cleanMojoText_(readMojoField_(row, ["notes", "note", "comments"]));
  const rawJson = JSON.stringify(row);
  const leadId = externalId ? `MOJO-${externalId}` : makeMojoLeadId_(contactName, propertyAddress, propertyZip, phone, email);

  return {
    leadId,
    importedAt: new Date(),
    source,
    contactName,
    firstName,
    lastName,
    propertyAddress,
    propertyCity,
    propertyState,
    propertyZip,
    mailingAddress,
    phone,
    phone2,
    email,
    status,
    tags,
    notes,
    rawJson,
  };
}

function mojoLeadToRow_(lead, now) {
  return [
    lead.leadId,
    lead.importedAt || now,
    lead.source,
    lead.contactName,
    lead.firstName,
    lead.lastName,
    lead.propertyAddress,
    lead.propertyCity,
    lead.propertyState,
    lead.propertyZip,
    lead.mailingAddress,
    lead.phone,
    lead.phone2,
    lead.email,
    lead.status,
    lead.tags,
    lead.notes,
    now,
    lead.rawJson,
  ];
}

function generateMojoWebhookToken() {
  runMojoSafely_("generateMojoWebhookToken", () => {
    setupMojoConnector(false);
    const token = Utilities.getUuid().replace(/-/g, "");
    setMojoSetting_("Webhook Token", token, "Use as ?token=... on the deployed Web App URL.");
    SpreadsheetApp.getUi().alert(`New webhook token:\n\n${token}\n\nKeep this private.`);
  });
}

function showMojoWebhookInfo() {
  runMojoSafely_("showMojoWebhookInfo", () => {
    setupMojoConnector(false);
    const url = ScriptApp.getService().getUrl() || "Deploy this Apps Script as a Web App first.";
    const token = getMojoSetting_("Webhook Token") || "Run Generate new webhook token first.";
    SpreadsheetApp.getUi().alert(`Webhook URL:\n${url}\n\nSend POST JSON to:\n${url}?token=${token}`);
  });
}

function seedMojoSettings_() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(MOJO_CONNECTOR.sheets.settings);
  if (sheet.getLastRow() > 1) return;
  appendMojoRows_(sheet, [
    ["Webhook Token", Utilities.getUuid().replace(/-/g, ""), "Private token required for doPost imports."],
    ["Duplicate Rule", "Upsert by Lead ID", "Existing Lead IDs are updated instead of duplicated."],
  ]);
}

function getMojoLeadIndex_(sheet) {
  const values = sheet.getLastRow() < 2 ? [] : sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
  return values.reduce((index, row, offset) => {
    const leadId = String(row[0] || "").trim();
    if (leadId) index[leadId] = offset + 2;
    return index;
  }, {});
}

function getMojoSetting_(settingName) {
  const sheet = SpreadsheetApp.getActive().getSheetByName(MOJO_CONNECTOR.sheets.settings);
  if (!sheet || sheet.getLastRow() < 2) return "";
  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getValues();
  const match = rows.find((row) => row[0] === settingName);
  return match ? String(match[1] || "").trim() : "";
}

function setMojoSetting_(settingName, value, notes) {
  const sheet = SpreadsheetApp.getActive().getSheetByName(MOJO_CONNECTOR.sheets.settings);
  const rows = sheet.getLastRow() < 2 ? [] : sheet.getRange(2, 1, sheet.getLastRow() - 1, 3).getValues();
  const matchIndex = rows.findIndex((row) => row[0] === settingName);
  if (matchIndex >= 0) {
    sheet.getRange(matchIndex + 2, 1, 1, 3).setValues([[settingName, value, notes || rows[matchIndex][2] || ""]]);
  } else {
    appendMojoRows_(sheet, [[settingName, value, notes || ""]]);
  }
}

function readMojoField_(row, names) {
  for (const name of names) {
    const key = normalizeMojoHeader_(name);
    if (row[key] !== undefined && row[key] !== "") return row[key];
  }
  return "";
}

function normalizeMojoHeader_(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function makeMojoLeadId_(contactName, address, zip, phone, email) {
  const key = [contactName, address, zip, phone, email].join("|").toLowerCase();
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, key);
  const hex = bytes.map((byte) => (`0${(byte & 0xff).toString(16)}`).slice(-2)).join("");
  return `MOJO-${hex.slice(0, 16)}`;
}

function formatMojoPhone_(value) {
  const digits = String(value || "").replace(/\D/g, "");
  const phone = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  return phone.length === 10 ? `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}` : cleanMojoText_(value);
}

function cleanMojoText_(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function cleanMojoState_(value) {
  return cleanMojoText_(value).toUpperCase();
}

function cleanMojoZip_(value) {
  const match = String(value || "").match(/\d{5}/);
  return match ? match[0] : cleanMojoText_(value);
}

function cleanMojoEmail_(value) {
  const email = String(value || "").trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

function ensureMojoSheet_(ss, name) {
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

function setMojoHeader_(sheet, headers) {
  const width = Math.max(1, headers.length);
  const current = sheet.getRange(1, 1, 1, width).getValues()[0];
  const missing = headers.some((header, index) => current[index] !== header);
  if (missing) sheet.getRange(1, 1, 1, width).setValues([headers]);
}

function appendMojoRows_(sheet, rows) {
  if (!rows.length) return;
  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
}

function logMojo_(action, message) {
  const sheet = SpreadsheetApp.getActive().getSheetByName(MOJO_CONNECTOR.sheets.log);
  if (sheet) appendMojoRows_(sheet, [[new Date(), action, message]]);
}

function jsonMojoResponse_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function runMojoSafely_(action, callback) {
  try {
    return callback();
  } catch (error) {
    try {
      logMojo_(action, error && error.message ? error.message : String(error));
    } catch (logError) {
      Logger.log(logError);
    }
    throw error;
  }
}
