// @ts-check
import { test, expect } from '@playwright/test';

const phoneViewport = { width: 390, height: 844 };

async function openMobile(page, path) {
  await page.setViewportSize(phoneViewport);
  await page.addInitScript(() => localStorage.clear());
  await page.goto(path, { waitUntil: 'domcontentloaded' });
}

async function expectPageFitsViewport(page) {
  const measurement = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));

  expect(measurement.scrollWidth).toBeLessThanOrEqual(measurement.clientWidth + 1);
}

test('CRM pages adapt to a phone viewport', async ({ page }) => {
  await openMobile(page, '/');

  await expect(page.locator('.topbar h1')).toHaveText('Dashboard');
  await expect(page.locator('.nav-links')).toHaveCSS('position', 'fixed');
  await expect(page.locator('#mobileQuickAction')).toBeVisible();
  await expectPageFitsViewport(page);

  await page.getByRole('link', { name: 'Contacts' }).click();
  await expect(page.locator('.topbar h1')).toHaveText('Contacts');
  await expect(page.locator('#contacts')).toBeVisible();
  await expectPageFitsViewport(page);

  await page.locator('[data-contact-profile]').first().click();
  await expect(page.locator('#contactProfile')).toBeVisible();
  await expect(page.locator('#contacts')).toBeHidden();
  await expectPageFitsViewport(page);

  await page.getByRole('link', { name: 'Dial' }).click();
  await expect(page.locator('.topbar h1')).toHaveText('Dial floor');
  await page.getByRole('button', { name: 'My schedule' }).click();
  await expect(page.locator('#dialSchedulePanel')).toBeVisible();
  await expectPageFitsViewport(page);

  await page.getByRole('link', { name: 'Admin' }).click();
  await expect(page.locator('.topbar h1')).toHaveText('Workspace admin');
  await expectPageFitsViewport(page);
});

test('CRM mobile layout works with reduced motion enabled', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openMobile(page, '/');

  await expect(page.locator('.topbar h1')).toHaveText('Dashboard');
  await page.getByRole('link', { name: 'Communications' }).click();
  await expect(page.locator('.topbar h1')).toHaveText('Communications');
  await expectPageFitsViewport(page);
});

test('lead generator and cost planner adapt to a phone viewport', async ({ page }) => {
  await openMobile(page, '/SafeLeadGenerator-Standalone.html');

  await expect(page.getByRole('heading', { name: 'Compliant Property Lead Builder' })).toBeVisible();
  await expectPageFitsViewport(page);

  await page.getByRole('button', { name: 'Cost planner' }).click();
  await expect(page.getByRole('heading', { name: 'Auto residential lead cost planner' })).toBeVisible();
  await expect(page.locator('[data-cost-category="propertyInfo"]')).toBeVisible();
  await expectPageFitsViewport(page);
});

test('Kira Recruit subpages adapt to a phone viewport', async ({ page }) => {
  await openMobile(page, '/recruiting.html');

  await expect(page.getByRole('heading', { name: 'Auto recruiting' })).toBeVisible();
  await expectPageFitsViewport(page);

  await page.getByRole('button', { name: 'Job details' }).click();
  await expect(page.locator('#job')).toBeVisible();
  await expectPageFitsViewport(page);

  await page.getByRole('button', { name: 'Single candidate location' }).click();
  await expect(page.locator('#applicants')).toBeVisible();
  await expectPageFitsViewport(page);
});
