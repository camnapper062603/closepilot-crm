import assert from "node:assert/strict";
import test from "node:test";
import {
  buildLaunchReadiness,
  launchChecklistTemplate,
  launchProviderDefinitions,
  launchRecommendation,
  launchReadinessCategories,
} from "../../command-center-config.js";

function providers(overrides = {}) {
  return launchProviderDefinitions.map((definition) => ({
    key: definition.key,
    label: definition.label,
    category: definition.category,
    configured: true,
    required: definition.required,
    status: "connected",
    displayStatus: "Connected",
    ...overrides[definition.key],
  }));
}

function readiness(overrides = {}) {
  return buildLaunchReadiness(
    launchReadinessCategories.map((category) => ({
      category_key: category.key,
      score: overrides[category.key]?.score ?? 95,
      status: overrides[category.key]?.status ?? "passed",
      source: "automatic",
      evidence: { test: true },
      weight: category.weight,
    })),
    providers(),
  );
}

function checklist(overrides = {}) {
  return launchChecklistTemplate.map((item) => ({
    key: item.key,
    label: item.label,
    completed: overrides[item.key]?.completed ?? true,
    status: overrides[item.key]?.status ?? "complete",
  }));
}

function statusSnapshot(overrides = {}) {
  return {
    launchStage: "private_beta",
    verifications: {
      tenant_isolation: "passed",
      production_smoke: "passed",
      release_gates: "passed",
      supabase_security: "passed",
      billing_live_path: "passed",
      required_migrations: "passed",
      plaintext_provider_tokens: "passed",
      auth_authorization: "passed",
      ...overrides,
    },
  };
}

function recommendation(input = {}) {
  return launchRecommendation({
    launchStage: input.launchStage || "private_beta",
    readiness: input.readiness || readiness(),
    blockers: input.blockers || [],
    checklist: input.checklist || checklist(),
    providers: input.providers || providers(),
    statusSnapshot: input.statusSnapshot || statusSnapshot(),
  });
}

test("critical blocker produces NO_GO and stable reason code", () => {
  const result = recommendation({
    blockers: [{ title: "Email confirmation outage", severity: "critical", status: "open" }],
  });

  assert.equal(result.status, "NO_GO");
  assert.equal(result.blockingReasons[0].code, "CRITICAL_BLOCKER_OPEN");
});

test("security and authentication thresholds are mandatory", () => {
  assert.equal(recommendation({ readiness: readiness({ security: { score: 79 } }) }).status, "NO_GO");
  assert.equal(recommendation({ readiness: readiness({ security: { score: 80 } }) }).blockingReasons.some((reason) => reason.code === "SECURITY_SCORE_BELOW_80"), false);

  assert.equal(recommendation({ readiness: readiness({ authentication: { score: 84 } }) }).status, "NO_GO");
  assert.equal(recommendation({ readiness: readiness({ authentication: { score: 85 } }) }).blockingReasons.some((reason) => reason.code === "AUTHENTICATION_SCORE_BELOW_85"), false);
});

test("failed and unknown required verification checks produce NO_GO", () => {
  assert.equal(recommendation({ statusSnapshot: statusSnapshot({ tenant_isolation: "failed" }) }).blockingReasons[0].code, "TENANT_ISOLATION_FAILED");
  assert.equal(recommendation({ statusSnapshot: statusSnapshot({ tenant_isolation: "unknown" }) }).blockingReasons[0].code, "TENANT_ISOLATION_UNKNOWN");
  assert.equal(recommendation({ statusSnapshot: statusSnapshot({ production_smoke: "failed" }) }).blockingReasons[0].code, "PRODUCTION_SMOKE_FAILED");
  assert.equal(recommendation({ statusSnapshot: statusSnapshot({ release_gates: "failed" }) }).blockingReasons[0].code, "RELEASE_GATES_FAILED");
  assert.equal(recommendation({ statusSnapshot: statusSnapshot({ supabase_security: "failed" }) }).blockingReasons[0].code, "SUPABASE_SECURITY_FAILED");
});

test("billing live path is mandatory for paid launch stages", () => {
  const result = recommendation({
    launchStage: "paying_pilot",
    statusSnapshot: statusSnapshot({ billing_live_path: "failed" }),
  });

  assert.equal(result.status, "NO_GO");
  assert.equal(result.blockingReasons.some((reason) => reason.code === "BILLING_LIVE_PATH_FAILED"), true);
});

test("required provider failure blocks while optional provider missing warns", () => {
  const requiredFailed = recommendation({
    providers: providers({ email: { configured: false, status: "failed", displayStatus: "Failed" } }),
  });
  assert.equal(requiredFailed.status, "NO_GO");
  assert.equal(requiredFailed.blockingReasons.some((reason) => reason.code === "REQUIRED_PROVIDER_FAILED"), true);

  const optionalMissing = recommendation({
    providers: providers({ sms: { configured: false, status: "setup_required", displayStatus: "Setup required" } }),
  });
  assert.equal(optionalMissing.status, "CONDITIONAL_GO");
  assert.equal(optionalMissing.warnings.some((warning) => warning.code === "OPTIONAL_PROVIDER_NOT_CONFIGURED"), true);
});

test("checklist failures, unknown categories, and migrations are mandatory", () => {
  assert.equal(recommendation({ checklist: checklist({ "release-gates": { status: "failed", completed: false } }) }).blockingReasons.some((reason) => reason.code === "REQUIRED_CHECKLIST_FAILED"), true);
  assert.equal(recommendation({ readiness: readiness({ security: { status: "unknown", score: 100 } }) }).blockingReasons.some((reason) => reason.code === "REQUIRED_CATEGORY_UNKNOWN"), true);
  assert.equal(recommendation({ statusSnapshot: statusSnapshot({ required_migrations: "failed" }) }).blockingReasons.some((reason) => reason.code === "REQUIRED_MIGRATION_NOT_APPLIED"), true);
});

test("high blockers produce conditional go and accepted risks are surfaced", () => {
  const high = recommendation({ blockers: [{ title: "Docs need polish", severity: "high", status: "open" }] });
  assert.equal(high.status, "CONDITIONAL_GO");
  assert.equal(high.warnings.some((warning) => warning.code === "HIGH_BLOCKER_OPEN"), true);

  const accepted = recommendation({
    blockers: [{ title: "Known mobile limitation", severity: "medium", status: "accepted_risk", acceptedRiskReason: "Private beta only." }],
  });
  assert.equal(accepted.status, "CONDITIONAL_GO");
  assert.equal(accepted.acceptedRisks.length, 1);
});

test("all required checks passing produces GO and score cannot override blockers", () => {
  const go = recommendation();
  assert.equal(go.status, "GO");

  const blocked = recommendation({
    readiness: readiness(),
    blockers: [{ title: "RLS broken", severity: "critical", status: "open" }],
  });
  assert.equal(blocked.status, "NO_GO");
  assert.equal(blocked.overallScore, 95);
});
