import { test, expect } from "@playwright/test";

test("critical shell controls have accessible names and focus-visible keyboard paths", async ({ page }) => {
  await page.goto("/?setup-workspace#pipeline", { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".app-shell:not([hidden])", { timeout: 30_000 });

  await expect(page.getByRole("button", { name: "Support" })).toBeVisible();
  await expect(page.getByRole("button", { name: /^\+ Lead$/ })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
  await expect(page.locator("#communicationToastRegion")).toHaveAttribute("aria-live", "polite");

  const unnamedButtons = await page.locator("button").evaluateAll((buttons) =>
    buttons
      .filter((button) => !button.textContent.trim() && !button.getAttribute("aria-label"))
      .map((button) => button.id || button.className || button.outerHTML.slice(0, 80)),
  );
  expect(unnamedButtons).toEqual([]);
});

test("support dialog keeps labels associated with fields and status announcements", async ({ page }) => {
  await page.goto("/?setup-workspace#pipeline", { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".app-shell:not([hidden])", { timeout: 30_000 });
  await page.getByRole("button", { name: "Support" }).click();

  const dialog = page.getByRole("dialog", { name: "Report a problem" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel("What happened?")).toHaveAttribute("required", "");
  await expect(dialog.getByLabel(/Include safe route/)).toBeVisible();
  await expect(page.locator("#supportReportStatus")).toHaveAttribute("role", "status");
});
