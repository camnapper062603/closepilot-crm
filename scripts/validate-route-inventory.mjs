import { readFile } from "node:fs/promises";
import { closePilotApiRoutes } from "../api-handlers.js";

const inventoryPath = new URL("../docs/route-permissions.json", import.meta.url);
const requiredFields = [
  "method",
  "route",
  "category",
  "public",
  "requiredAuthentication",
  "workspaceRequired",
  "minimumRole",
  "resourceOwnershipChecks",
  "provider",
  "rateLimit",
  "tests",
];

const inventory = JSON.parse(await readFile(inventoryPath, "utf8"));
const actual = closePilotApiRoutes.map(routeKey).sort();
const listed = inventory.map(routeKey).sort();
const failures = [];

if (new Set(listed).size !== listed.length) {
  failures.push("Route inventory contains duplicate method+route entries.");
}

for (const route of inventory) {
  const missingFields = requiredFields.filter((field) => !Object.prototype.hasOwnProperty.call(route, field));
  if (missingFields.length) {
    failures.push(`${route.method || "?"} ${route.route || "?"} is missing fields: ${missingFields.join(", ")}`);
  }
  if (!Array.isArray(route.resourceOwnershipChecks) || !route.resourceOwnershipChecks.length) {
    failures.push(`${route.method} ${route.route} must list resourceOwnershipChecks.`);
  }
  if (!Array.isArray(route.tests) || !route.tests.length) {
    failures.push(`${route.method} ${route.route} must list security tests.`);
  }
}

for (const key of actual.filter((entry) => !listed.includes(entry))) {
  failures.push(`Missing from route inventory: ${key}`);
}

for (const key of listed.filter((entry) => !actual.includes(entry))) {
  failures.push(`Inventory route is not registered by api-handlers.js: ${key}`);
}

if (failures.length) {
  console.error("Route inventory validation failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Route inventory validated for ${actual.length} ClosePilot API routes.`);

function routeKey(entry) {
  return `${String(entry.method || "").toUpperCase()} ${entry.route}`;
}
