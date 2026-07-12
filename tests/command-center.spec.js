// @ts-check
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
});

test('daily command center opens as its own CRM page in demo mode', async ({ page }) => {
  await page.goto('/?demo=1#daily-command', { waitUntil: 'load' });
  await page.waitForSelector('.app-shell:not([hidden])', { timeout: 30_000 });

  await expect(page.locator('.topbar h1')).toHaveText('Daily Command');
  await expect(page.locator('#customerDailyCommandPage')).toBeVisible();
  await expect(page.locator('#customerDailyCommandMode')).toContainText(/Demo|Local/i);
  await expect(page.locator('#customerDailyPriorities')).toContainText(/Call|Finish|Prepare|Review|Create/);
  await expect(page.locator('#customerDailyKpis')).toContainText('Open pipeline');
  await expect(page.locator('#dailyCommandCenter')).toBeHidden();
});

test('launch command center direct route is locked in public demo mode', async ({ page }) => {
  await page.goto('/launch-command-center?demo=1', { waitUntil: 'load' });
  await page.waitForSelector('.app-shell:not([hidden])', { timeout: 30_000 });

  await expect(page.locator('.topbar h1')).toHaveText('Launch Command Center');
  await expect(page.locator('#launchCommandCenterPage')).toBeVisible();
  await expect(page.locator('#launchRecommendation')).toHaveText('Locked');
  await expect(page.locator('#launchRecommendationReason')).toContainText('not available in public demo mode');
});
