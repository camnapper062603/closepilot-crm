import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";

const migrationFiles = [
  "supabase/migrations/20260712_launch_command_center.sql",
  "supabase/migrations/20260713_launch_policy_categories.sql",
  "supabase/migrations/20260713_launch_blocker_beta_fields.sql",
];

test("launch command center migrations are tracked by git", () => {
  const tracked = execFileSync("git", ["ls-files", "supabase/migrations"], { encoding: "utf8" });
  for (const file of migrationFiles) assert.match(tracked, new RegExp(file.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});

test("new migrations add readiness, blocker, beta, and attribution columns", () => {
  const policy = readFileSync("supabase/migrations/20260713_launch_policy_categories.sql", "utf8");
  const fields = readFileSync("supabase/migrations/20260713_launch_blocker_beta_fields.sql", "utf8");
  const schema = readFileSync("supabase-schema.sql", "utf8");

  for (const column of ["weight", "status", "source", "evidence", "checked_at"]) {
    assert.match(policy, new RegExp(`add column if not exists ${column}`));
    assert.match(schema, new RegExp(`add column if not exists ${column}`));
  }

  for (const column of [
    "category",
    "evidence_url",
    "resolution_notes",
    "accepted_risk_reason",
    "launch_blocking",
    "target_stage",
    "owner_user_id",
    "resolved_at",
    "contact_email",
    "onboarding_stage",
    "beta_status",
    "conversion_likelihood",
    "assigned_owner",
    "next_action_due_at",
    "sent_by",
    "recorded_by",
    "booked_by",
  ]) {
    assert.match(fields, new RegExp(column));
    assert.match(schema, new RegExp(column));
  }
});

test("migration keeps founder tables service-role only and workspace goals tenant-scoped", () => {
  const base = readFileSync("supabase/migrations/20260712_launch_command_center.sql", "utf8");

  assert.match(base, /auth\.role\(\) = 'service_role'/);
  assert.match(base, /public\.is_workspace_member\(workspace_id\)/);
  assert.match(base, /public\.is_workspace_admin\(workspace_id\)/);
});
