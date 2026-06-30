const APOLLO_PEOPLE_SEARCH_URL = "https://api.apollo.io/api/v1/mixed_people/api_search";
const HUNTER_DOMAIN_SEARCH_URL = "https://api.hunter.io/v2/domain-search";

export async function handleBusinessEnrichmentRequest(request, response) {
  if (request.method === "OPTIONS") {
    sendCors(response, 204);
    return;
  }

  if (request.method !== "POST") {
    sendJson(response, 405, { error: "Method not allowed" });
    return;
  }

  try {
    assertClientAllowed(request);
    const payload = await readJsonBody(request);
    const result = await enrichBusinesses(payload, process.env);
    sendJson(response, 200, result);
  } catch (error) {
    sendJson(response, error.statusCode || 500, { error: error.message || String(error) });
  }
}

export async function enrichBusinesses(payload, env = process.env, fetchImpl = fetch) {
  const providers = new Set(normalizeArray(payload.providers || ["apollo", "hunter"]));
  const domains = normalizeArray(payload.domains).map(normalizeDomain).filter(Boolean);
  const titles = normalizeArray(payload.titles).filter(Boolean);
  const locations = normalizeArray(payload.locations).filter(Boolean);
  const limit = clampNumber(payload.limit, 1, 50, 20);
  const warnings = [];
  const records = [];
  const apolloKey = env.APOLLO_API_KEY || "";
  const hunterKey = env.HUNTER_API_KEY || "";

  if (providers.has("apollo")) {
    if (apolloKey) {
      const apolloRecords = await searchApollo({ apiKey: apolloKey, domains, titles, locations, limit, fetchImpl });
      records.push(...apolloRecords);
    } else {
      warnings.push("Apollo skipped: APOLLO_API_KEY is not configured.");
    }
  }

  const hunterDomains = new Set(domains);
  if (payload.useHunterForApolloDomains !== false) {
    records.forEach((record) => {
      const domain = normalizeDomain(record.domain);
      if (domain) hunterDomains.add(domain);
    });
  }

  if (providers.has("hunter")) {
    if (hunterKey) {
      const hunterRecords = await searchHunterDomains({
        apiKey: hunterKey,
        domains: Array.from(hunterDomains).slice(0, limit),
        limit,
        fetchImpl,
      });
      records.push(...hunterRecords);
    } else {
      warnings.push("Hunter skipped: HUNTER_API_KEY is not configured.");
    }
  }

  return {
    records: dedupeRecords(records).slice(0, limit * 5),
    warnings,
    sources: {
      apollo: providers.has("apollo") && Boolean(apolloKey),
      hunter: providers.has("hunter") && Boolean(hunterKey),
    },
  };
}

async function searchApollo({ apiKey, domains, titles, locations, limit, fetchImpl }) {
  const url = new URL(APOLLO_PEOPLE_SEARCH_URL);
  url.searchParams.set("per_page", String(Math.min(limit, 100)));
  url.searchParams.set("page", "1");
  titles.forEach((title) => url.searchParams.append("person_titles[]", title));
  locations.forEach((location) => url.searchParams.append("person_locations[]", location));
  domains.forEach((domain) => url.searchParams.append("q_organization_domains_list[]", domain));

  const response = await fetchImpl(url, {
    method: "POST",
    headers: {
      "accept": "application/json",
      "cache-control": "no-cache",
      "content-type": "application/json",
      "x-api-key": apiKey,
    },
  });

  const data = await readProviderJson(response, "Apollo");
  const people = data.people || data.contacts || data.results || [];
  return people.map(normalizeApolloPerson).filter((record) => record.personName || record.organizationName || record.domain);
}

async function searchHunterDomains({ apiKey, domains, limit, fetchImpl }) {
  const output = [];

  for (const domain of domains) {
    const url = new URL(HUNTER_DOMAIN_SEARCH_URL);
    url.searchParams.set("domain", domain);
    url.searchParams.set("limit", String(Math.min(limit, 100)));

    const response = await fetchImpl(url, {
      headers: {
        "accept": "application/json",
        "x-api-key": apiKey,
      },
    });

    const data = await readProviderJson(response, "Hunter");
    const company = data.data || {};
    const emails = company.emails || [];
    emails.forEach((emailRecord) => {
      output.push(normalizeHunterEmail(company, emailRecord, domain));
    });
  }

  return output;
}

function normalizeApolloPerson(person) {
  const organization = person.organization || person.current_organization || {};
  const domain = normalizeDomain(organization.primary_domain || organization.website_url || person.organization_website_url || person.organization_domain);
  const organizationName = cleanText(organization.name || person.organization_name || person.company || "");
  const firstName = cleanText(person.first_name || "");
  const lastName = cleanText(person.last_name || "");
  const personName = cleanText(person.name || [firstName, lastName].filter(Boolean).join(" "));
  const city = cleanText(person.city || person.person_city || organization.city || "");
  const state = cleanText(person.state || person.person_state || organization.state || "");

  return {
    provider: "apollo",
    source: "Apollo People Search API",
    personName,
    firstName,
    lastName,
    title: cleanText(person.title || person.headline || ""),
    organizationName,
    domain,
    website: domain ? `https://${domain}` : "",
    email: normalizeEmail(person.email || person.email_address || ""),
    phone: normalizePhone(person.phone || person.mobile_phone || person.sanitized_phone || ""),
    city,
    state,
    address: cleanText(organization.street_address || organization.raw_address || ""),
    confidence: person.email_status === "verified" ? 90 : 70,
  };
}

function normalizeHunterEmail(company, emailRecord, fallbackDomain) {
  const firstName = cleanText(emailRecord.first_name || "");
  const lastName = cleanText(emailRecord.last_name || "");
  const domain = normalizeDomain(company.domain || fallbackDomain);

  return {
    provider: "hunter",
    source: "Hunter Domain Search API",
    personName: cleanText([firstName, lastName].filter(Boolean).join(" ") || emailRecord.value || ""),
    firstName,
    lastName,
    title: cleanText(emailRecord.position || emailRecord.job_title || ""),
    organizationName: cleanText(company.organization || company.company || domain),
    domain,
    website: domain ? `https://${domain}` : "",
    email: normalizeEmail(emailRecord.value || ""),
    phone: "",
    city: "",
    state: "",
    address: "",
    confidence: clampNumber(emailRecord.confidence, 0, 100, 70),
  };
}

async function readProviderJson(response, provider) {
  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`${provider} returned a non-JSON response.`);
  }

  if (!response.ok) {
    const message = data.error?.message || data.message || data.errors?.[0]?.details || data.errors?.[0]?.message || `${provider} request failed with ${response.status}.`;
    throw new Error(message);
  }

  return data;
}

function dedupeRecords(records) {
  const seen = new Set();
  return records.filter((record) => {
    const key = [record.email, record.phone, record.personName, record.organizationName, record.domain].map((value) => String(value || "").toLowerCase()).join("|");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function assertClientAllowed(request) {
  const requiredToken = process.env.ENRICHMENT_CLIENT_TOKEN || "";
  if (!requiredToken) return;

  const providedToken =
    request.headers.authorization?.replace(/^Bearer\s+/i, "") ||
    request.headers["x-client-token"] ||
    request.headers.get?.("authorization")?.replace(/^Bearer\s+/i, "") ||
    request.headers.get?.("x-client-token") ||
    "";

  if (providedToken !== requiredToken) {
    const error = new Error("Unauthorized enrichment request.");
    error.statusCode = 401;
    throw error;
  }
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 200000) {
        reject(new Error("Request body is too large."));
        request.destroy();
      }
    });
    request.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Invalid JSON request body."));
      }
    });
    request.on("error", reject);
  });
}

function sendCors(response, statusCode) {
  response.writeHead(statusCode, corsHeaders());
  response.end();
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    ...corsHeaders(),
    "content-type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(payload));
}

function corsHeaders() {
  return {
    "access-control-allow-origin": process.env.ENRICHMENT_ALLOWED_ORIGIN || "*",
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type, authorization, x-client-token",
  };
}

function normalizeArray(value) {
  if (Array.isArray(value)) return value.map(cleanText).filter(Boolean);
  return String(value || "")
    .split(/[\n,]+/)
    .map(cleanText)
    .filter(Boolean);
}

function normalizeDomain(value) {
  const text = cleanText(value)
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .split("/")[0]
    .toLowerCase();
  return /^[a-z0-9.-]+\.[a-z]{2,}$/.test(text) ? text : "";
}

function normalizeEmail(value) {
  const email = cleanText(value).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

function normalizePhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) return digits.slice(1);
  return digits.length === 10 ? digits : "";
}

function cleanText(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, number));
}
