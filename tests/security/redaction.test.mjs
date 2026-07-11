import assert from "node:assert/strict";
import test from "node:test";
import { redactSecurityLog } from "../../api-handlers.js";

test("security log redaction removes provider and auth secrets recursively", () => {
  const redacted = redactSecurityLog({
    authorization: "Bearer abcdefghijklmnopqrstuvwxyz123456",
    nested: {
      refresh_token: "ya29_refresh_token_value",
      harmless: "visible",
      notes: "use sk_live_1234567890abcdef carefully",
    },
    rows: [{ apiToken: "SG_secret_key_123456" }],
  });

  const serialized = JSON.stringify(redacted);
  assert.equal(serialized.includes("abcdefghijklmnopqrstuvwxyz123456"), false);
  assert.equal(serialized.includes("ya29_refresh_token_value"), false);
  assert.equal(serialized.includes("sk_live_1234567890abcdef"), false);
  assert.equal(serialized.includes("SG_secret_key_123456"), false);
  assert.equal(redacted.nested.harmless, "visible");
});
