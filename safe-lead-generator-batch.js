import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

const importDir = "lead-generator-imports";
const outputDir = "lead-generator-outputs";

const inputs = {
  properties: "property-records.csv",
  contacts: "contact-enrichment.csv",
  federalDnc: "federal-dnc.csv",
  stateDnc: "state-dnc.csv",
  optOuts: "internal-opt-outs.csv",
};

const options = {
  minimumConfidence: Number(process.env.MIN_CONFIDENCE || 70),
  channel: process.env.CHANNEL || "any",
  dncMaxDays: Number(process.env.DNC_MAX_DAYS || 30),
  scrubDate: new Date(process.env.SCRUB_DATE || new Date()),
};

async function main() {
  await mkdir(outputDir, { recursive: true });

  const properties = (await readRequiredCsv(inputs.properties)).map(normalizeProperty).filter((row) => row.ownerName && row.propertyAddress);
  const contacts = (await readRequiredCsv(inputs.contacts)).flatMap(normalizeContact).filter((row) => row.ownerName || row.phone || row.email);
  const federalDnc = new Set((await readRequiredCsv(inputs.federalDnc)).map((row) => normalizePhone(readField(row, ["phone", "number", "telephone"]))).filter(Boolean));
  const stateDnc = loadStateDnc(await readRequiredCsv(inputs.stateDnc));
  const optOutRows = await readOptionalCsv(inputs.optOuts);
  const optOutPhones = new Set();
  const optOutEmails = new Set();

  optOutRows.forEach((row) => {
    const phone = normalizePhone(readField(row, ["phone", "number", "telephone"]));
    const email = normalizeEmail(readField(row, ["email", "email_address"]));
    if (phone) optOutPhones.add(phone);
    if (email) optOutEmails.add(email);
  });

  if (!properties.length) throw new Error("No property records found after import.");
  if (!contacts.length && options.channel !== "mail") throw new Error("No contact enrichment rows found after import.");
  if ((options.channel === "any" || options.channel === "phone") && dncIsStale()) {
    throw new Error(`DNC scrub date must be within ${options.dncMaxDays} days. Set SCRUB_DATE=YYYY-MM-DD if needed.`);
  }

  const result = generateLeads({ properties, contacts, federalDnc, stateDnc, optOutPhones, optOutEmails });
  const leadRows = result.leads.map(leadToCsvRow);
  const auditRows = result.audit.map(auditToCsvRow);

  await writeCsv(join(outputDir, "safe-leads.csv"), leadRows);
  await writeCsv(join(outputDir, "suppression-audit.csv"), auditRows);
  await writeFile(
    join(outputDir, "run-summary.json"),
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        options,
        counts: {
          properties: properties.length,
          contacts: contacts.length,
          federalDnc: federalDnc.size,
          stateDnc: stateDnc.size,
          optOutPhones: optOutPhones.size,
          optOutEmails: optOutEmails.size,
          safeLeads: result.leads.length,
          suppressedPhones: result.audit.length,
        },
        files: {
          safeLeads: "lead-generator-outputs/safe-leads.csv",
          suppressionAudit: "lead-generator-outputs/suppression-audit.csv",
        },
      },
      null,
      2,
    )}\n`,
  );

  console.log(`Safe leads generated: ${result.leads.length}`);
  console.log(`Suppressed phone candidates: ${result.audit.length}`);
  console.log("Outputs:");
  console.log("  lead-generator-outputs/safe-leads.csv");
  console.log("  lead-generator-outputs/suppression-audit.csv");
  console.log("  lead-generator-outputs/run-summary.json");
}

function generateLeads({ properties, contacts, federalDnc, stateDnc, optOutPhones, optOutEmails }) {
  const leads = [];
  const audit = [];

  properties.forEach((property) => {
    const matches = findContactsForProperty(property, contacts).filter((contact) => contact.confidence >= options.minimumConfidence);
    const candidateContacts = matches.length
      ? matches
      : [{ ownerName: property.ownerName, phone: "", email: "", confidence: 0, source: "No enrichment match" }];

    candidateContacts.forEach((contact) => {
      const phoneCheck = checkPhoneCompliance(contact.phone, property.propertyState, federalDnc, stateDnc, optOutPhones);
      const emailCheck = checkEmailCompliance(contact.email, optOutEmails);
      const postalReady = Boolean(property.mailingAddress || property.propertyAddress);
      const channels = [];

      if (options.channel !== "email" && options.channel !== "mail" && contact.phone && phoneCheck.allowed) channels.push("phone");
      if (options.channel !== "phone" && options.channel !== "mail" && contact.email && emailCheck.allowed) channels.push("email");
      if (options.channel !== "phone" && options.channel !== "email" && postalReady) channels.push("postal");

      if (contact.phone && !phoneCheck.allowed) {
        audit.push({
          ownerName: property.ownerName,
          phone: formatPhone(contact.phone),
          reason: phoneCheck.reason,
          list: phoneCheck.list,
          source: contact.source || "Contact enrichment",
        });
      }

      if (!channels.length) return;

      leads.push({
        ownerName: property.ownerName,
        propertyAddress: compactAddress(property.propertyAddress, property.propertyCity, property.propertyState, property.propertyZip),
        mailingAddress: compactAddress(property.mailingAddress, property.mailingCity, property.mailingState, property.mailingZip),
        phone: phoneCheck.allowed ? formatPhone(contact.phone) : "",
        email: emailCheck.allowed ? contact.email : "",
        confidence: contact.confidence,
        source: contact.source,
        channels,
        score: scoreLead(property, contact, channels),
        compliance: complianceSummary(phoneCheck, emailCheck, channels),
        parcelId: property.parcelId,
        county: property.county,
      });
    });
  });

  return {
    leads: dedupeLeads(leads).sort((a, b) => b.score - a.score),
    audit,
  };
}

async function readRequiredCsv(filename) {
  const path = join(importDir, filename);
  if (!existsSync(path)) throw new Error(`Missing required import file: ${path}`);
  return parseCsv(await readFile(path, "utf8"));
}

async function readOptionalCsv(filename) {
  const path = join(importDir, filename);
  if (!existsSync(path)) return [];
  return parseCsv(await readFile(path, "utf8"));
}

function loadStateDnc(rows) {
  const stateDnc = new Map();
  rows.forEach((row) => {
    const phone = normalizePhone(readField(row, ["phone", "number", "telephone"]));
    const listState = normalizeState(readField(row, ["state", "list_state", "jurisdiction"]));
    if (!phone) return;
    if (!stateDnc.has(phone)) stateDnc.set(phone, new Set());
    stateDnc.get(phone).add(listState || "ALL");
  });
  return stateDnc;
}

function dncIsStale() {
  return Number.isNaN(options.scrubDate.getTime()) || Math.abs(new Date() - options.scrubDate) / (1000 * 60 * 60 * 24) > options.dncMaxDays;
}

function findContactsForProperty(property, contacts) {
  const ownerToken = normalizeToken(property.ownerName);
  const mailingToken = normalizeToken(property.mailingAddress);
  const propertyToken = normalizeToken(property.propertyAddress);

  return contacts.filter((contact) => {
    const contactOwner = normalizeToken(contact.ownerName);
    const contactAddress = normalizeToken(contact.mailingAddress || contact.propertyAddress || contact.address);
    const ownerMatch = ownerToken && contactOwner && (ownerToken.includes(contactOwner) || contactOwner.includes(ownerToken));
    const addressMatch = contactAddress && (contactAddress === mailingToken || contactAddress === propertyToken);
    return ownerMatch || addressMatch;
  });
}

function checkPhoneCompliance(phone, leadState, federalDnc, stateDnc, optOutPhones) {
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) return { allowed: false, reason: "No phone", list: "none" };
  if (optOutPhones.has(normalizedPhone)) return { allowed: false, reason: "Internal opt-out", list: "internal" };
  if (federalDnc.has(normalizedPhone)) return { allowed: false, reason: "Federal DNC match", list: "federal" };
  const stateLists = stateDnc.get(normalizedPhone);
  const propertyState = normalizeState(leadState);
  if (stateLists && (stateLists.has("ALL") || stateLists.has(propertyState))) {
    return { allowed: false, reason: "State DNC match", list: propertyState || "state" };
  }
  return { allowed: true, reason: "Phone clear", list: "clear" };
}

function checkEmailCompliance(email, optOutEmails) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return { allowed: false, reason: "No email" };
  if (optOutEmails.has(normalizedEmail)) return { allowed: false, reason: "Email opt-out" };
  return { allowed: true, reason: "Email clear" };
}

function scoreLead(property, contact, channels) {
  let score = Number(contact.confidence || 0);
  const value = Number(String(property.assessedValue || "").replace(/[^0-9.]/g, ""));
  if (value >= 300000) score += 8;
  if (property.ownerOccupied) score += 6;
  if (channels.includes("phone")) score += 5;
  if (channels.includes("email")) score += 3;
  if (property.acreage && Number(property.acreage) >= 0.2) score += 2;
  return Math.min(100, Math.round(score));
}

function complianceSummary(phoneCheck, emailCheck, channels) {
  const pieces = [];
  if (channels.includes("phone")) pieces.push("phone DNC clear");
  if (channels.includes("email")) pieces.push(emailCheck.reason);
  if (channels.includes("postal")) pieces.push("postal allowed");
  if (!phoneCheck.allowed && phoneCheck.reason !== "No phone") pieces.push(phoneCheck.reason);
  return pieces.join("; ");
}

function normalizeProperty(row) {
  const propertyAddress = readField(row, ["property_address", "situs_address", "site_address", "address"]);
  const mailingAddress = readField(row, ["mailing_address", "owner_address", "mail_address"]);
  return {
    ownerName: readField(row, ["owner_name", "owner", "grantee", "buyer_name", "name"]),
    propertyAddress,
    propertyCity: readField(row, ["property_city", "situs_city", "city"]),
    propertyState: normalizeState(readField(row, ["property_state", "situs_state", "state"])),
    propertyZip: readField(row, ["property_zip", "situs_zip", "zip"]),
    mailingAddress,
    mailingCity: readField(row, ["mailing_city", "owner_city"]),
    mailingState: normalizeState(readField(row, ["mailing_state", "owner_state"])),
    mailingZip: readField(row, ["mailing_zip", "owner_zip"]),
    saleDate: readField(row, ["sale_date", "recording_date", "deed_date"]),
    assessedValue: readField(row, ["assessed_value", "market_value", "value"]),
    acreage: readField(row, ["acreage", "acres", "lot_size"]),
    county: readField(row, ["county"]),
    parcelId: readField(row, ["parcel_id", "apn", "folio", "pin"]),
    ownerOccupied: normalizeToken(propertyAddress) === normalizeToken(mailingAddress || propertyAddress),
  };
}

function normalizeContact(row) {
  const phones = [
    readField(row, ["phone", "phone1", "primary_phone", "mobile", "landline"]),
    readField(row, ["phone2", "secondary_phone"]),
    readField(row, ["phone3"]),
  ].filter(Boolean);
  const emails = [readField(row, ["email", "email1", "email_address"]), readField(row, ["email2"])].filter(Boolean);
  const base = {
    ownerName: readField(row, ["owner_name", "name", "full_name"]),
    mailingAddress: readField(row, ["mailing_address", "address", "owner_address"]),
    propertyAddress: readField(row, ["property_address", "site_address"]),
    confidence: Number(readField(row, ["confidence", "match_confidence", "score"]) || 0),
    source: readField(row, ["source", "provider", "vendor"]) || "Uploaded enrichment",
  };
  const maxLength = Math.max(phones.length, emails.length, 1);
  return Array.from({ length: maxLength }, (_, index) => ({
    ...base,
    phone: normalizePhone(phones[index] || phones[0] || ""),
    email: normalizeEmail(emails[index] || emails[0] || ""),
  }));
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === "\"" && quoted && next === "\"") {
      value += "\"";
      index += 1;
    } else if (char === "\"") {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(value);
      value = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(value);
      if (row.some((cell) => cell.trim())) rows.push(row);
      row = [];
      value = "";
    } else {
      value += char;
    }
  }
  row.push(value);
  if (row.some((cell) => cell.trim())) rows.push(row);
  if (!rows.length) return [];
  const headers = rows.shift().map((header) => normalizeHeader(header));
  return rows.map((cells) =>
    headers.reduce((record, header, index) => {
      record[header] = (cells[index] || "").trim();
      return record;
    }, {}),
  );
}

function readField(row, names) {
  for (const name of names) {
    const key = normalizeHeader(name);
    if (row[key] !== undefined && row[key] !== "") return row[key];
  }
  return "";
}

function normalizeHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function normalizePhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) return digits.slice(1);
  return digits.length === 10 ? digits : "";
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeState(value) {
  return String(value || "").trim().toUpperCase();
}

function normalizeToken(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function compactAddress(address, city, state, zip) {
  return [address, city, state, zip].filter(Boolean).join(", ");
}

function formatPhone(phone) {
  const digits = normalizePhone(phone);
  return digits ? `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}` : "";
}

function dedupeLeads(leads) {
  const seen = new Set();
  return leads.filter((lead) => {
    const key = `${normalizeToken(lead.ownerName)}|${normalizeToken(lead.propertyAddress)}|${lead.phone}|${lead.email}|${lead.channels.join("-")}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function leadToCsvRow(lead) {
  return {
    owner_name: lead.ownerName,
    property_address: lead.propertyAddress,
    mailing_address: lead.mailingAddress,
    phone: lead.phone,
    email: lead.email,
    score: lead.score,
    channels: lead.channels.join("|"),
    compliance: lead.compliance,
    source: lead.source,
    county: lead.county,
    parcel_id: lead.parcelId,
  };
}

function auditToCsvRow(row) {
  return {
    owner_name: row.ownerName,
    phone: row.phone,
    reason: row.reason,
    list: row.list,
    source: row.source,
  };
}

async function writeCsv(path, records) {
  if (!records.length) {
    await writeFile(path, "");
    return;
  }
  const headers = Object.keys(records[0]);
  const csv = [headers.join(",")]
    .concat(records.map((record) => headers.map((header) => csvEscape(record[header])).join(",")))
    .join("\n");
  await writeFile(path, `${csv}\n`);
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, "\"\"")}"` : text;
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
