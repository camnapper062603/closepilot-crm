import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { closePilotApiRoutes } from "../../api-handlers.js";

test("route inventory covers exactly the registered ClosePilot API routes", async () => {
  const inventory = JSON.parse(await readFile(new URL("../../docs/route-permissions.json", import.meta.url), "utf8"));
  const actual = closePilotApiRoutes.map(routeKey).sort();
  const listed = inventory.map(routeKey).sort();
  assert.deepEqual(listed, actual);
  assert.equal(inventory.every((route) => route.requiredAuthentication && route.minimumRole && route.rateLimit), true);
});

function routeKey(route) {
  return `${route.method} ${route.route}`;
}
