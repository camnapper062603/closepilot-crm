import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/?setup-workspace#pipeline", { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".app-shell:not([hidden])", { timeout: 30_000 });
});

test("offline banner and support report state are visible and recoverable", async ({ page, context }) => {
  await context.setOffline(true);
  await page.evaluate(() => window.dispatchEvent(new Event("offline")));
  await expect(page.locator("#offlineBanner")).toBeVisible();
  await expect(page.locator("#offlineBanner")).toContainText("Provider actions will not be marked successful");

  await context.setOffline(false);
  await page.evaluate(() => window.dispatchEvent(new Event("online")));
  await expect(page.locator("#offlineBanner")).toBeHidden();

  await page.getByRole("button", { name: "Support" }).click();
  const dialog = page.getByRole("dialog", { name: "Report a problem" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel("What happened?")).toBeVisible();
  await dialog.getByLabel("What happened?").fill("Unit test support report.");
  await dialog.getByLabel(/Include safe route/).check();
  await expect(page.locator("#supportDiagnosticsPreview")).toContainText("requestId");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("mobile drawer opens with focus, closes on Escape, and avoids page overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const toggle = page.getByRole("button", { name: "Menu" });
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("body")).toHaveAttribute("data-mobile-nav-open", "true");
  await expect(page.locator("#appSidebar")).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("body")).toHaveAttribute("data-mobile-nav-open", "false");

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  expect(overflow).toBe(false);
});
