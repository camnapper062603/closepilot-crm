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

async function openMobileNav(page) {
  const menu = page.getByRole('button', { name: 'Menu' });
  await expect(menu).toBeVisible();
  await menu.click();
  await expect(page.locator('body')).toHaveAttribute('data-mobile-nav-open', 'true');
}

test('CRM pages adapt to a phone viewport', async ({ page }) => {
  await openMobile(page, '/?setup-workspace');

  await expect(page.locator('.topbar h1')).toHaveText('Dashboard');
  await expect(page.getByRole('button', { name: 'Menu' })).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('.sidebar')).toHaveCSS('position', 'fixed');
  await expect(page.locator('#subpageNav')).toHaveCSS('overflow-x', 'auto');
  await expect(page.locator('#mobileQuickAction')).toBeHidden();
  await expectPageFitsViewport(page);

  await openMobileNav(page);
  await page.getByRole('link', { name: 'Contacts' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-mobile-nav-open', 'false');
  await expect(page.locator('.topbar h1')).toHaveText('Contacts');
  await expect(page.locator('#contacts')).toBeVisible();
  await expectPageFitsViewport(page);

  await page.locator('[data-contact-profile]').first().click();
  await expect(page.locator('#contactProfile')).toBeVisible();
  await expect(page.locator('#contacts')).toBeHidden();
  await expectPageFitsViewport(page);

  await openMobileNav(page);
  await page.getByRole('link', { name: 'Dial' }).click();
  await expect(page.locator('.topbar h1')).toHaveText('Dial floor');
  await page.getByRole('button', { name: 'My schedule' }).click();
  await expect(page.locator('#dialSchedulePanel')).toBeVisible();
  await expectPageFitsViewport(page);

  await openMobileNav(page);
  await page.getByRole('link', { name: 'Admin' }).click();
  await expect(page.locator('.topbar h1')).toHaveText('Workspace admin');
  await expectPageFitsViewport(page);

  await openMobileNav(page);
  await page.getByRole('link', { name: 'Settings' }).click();
  await expect(page.locator('.topbar h1')).toHaveText('Settings');
  await expect(page.locator('#customizationForm')).toBeVisible();
  await expectPageFitsViewport(page);
});

test('CRM mobile layout works with reduced motion enabled', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openMobile(page, '/?setup-workspace');

  await expect(page.locator('.topbar h1')).toHaveText('Dashboard');
  await openMobileNav(page);
  await page.getByRole('link', { name: 'Communications' }).click();
  await expect(page.locator('.topbar h1')).toHaveText('Communications');
  await expectPageFitsViewport(page);
});

test('lead generator and cost planner adapt to a phone viewport', async ({ page }) => {
  await openMobile(page, '/lead-generator');

  await expect(page.getByRole('heading', { name: 'Compliant Property Lead Builder' })).toBeVisible();
  await expectPageFitsViewport(page);

  await page.getByRole('button', { name: 'Cost planner' }).click();
  await expect(page.getByRole('heading', { name: 'Auto residential lead cost planner' })).toBeVisible();
  await expect(page.locator('[data-cost-category="propertyInfo"]')).toBeVisible();
  await expectPageFitsViewport(page);
});

test('Kira Recruit subpages adapt to a phone viewport', async ({ page }) => {
  await openMobile(page, '/recruiting.html');

  await expect(page.getByRole('heading', { name: 'Kira Recruit Command Center' })).toBeVisible();
  await expect(page.locator('#mobileRecruitTabs')).toBeVisible();
  await expect(page.locator('#dashboard')).toHaveAttribute('data-mobile-tab', 'overview');
  await page.getByRole('button', { name: 'Pipeline' }).click();
  await expect(page.locator('#dashboard')).toHaveAttribute('data-mobile-tab', 'pipeline');
  await expect(page.locator('#mobilePipelineStages')).toBeVisible();
  await expect(page.locator('#mobilePipelineStages')).toContainText('New');
  await page.locator('#mobilePipelineStages').getByRole('button', { name: /Screened/ }).click();
  await expect(page.locator('#dashboard')).toHaveAttribute('data-mobile-stage', 'screened');
  await expect(page.locator('#pipelineBoard')).toBeVisible();
  await page.getByRole('button', { name: 'AI' }).click();
  await expect(page.locator('#dashboard')).toHaveAttribute('data-mobile-tab', 'ai');
  await expect(page.locator('#aiRecruiterPanel')).toBeVisible();
  await expectPageFitsViewport(page);

  await page.getByRole('link', { name: 'Job details' }).click();
  await expect(page.locator('#job')).toBeVisible();
  await expectPageFitsViewport(page);

  await page.getByRole('link', { name: 'Single candidate location' }).click();
  await expect(page.locator('#applicants')).toBeVisible();
  await expectPageFitsViewport(page);
});

test('coming soon preview locked states fit a phone viewport', async ({ page }) => {
  await openMobile(page, '/lead-generator?role=member');
  await expect(page.locator('#leadAccessBanner')).toBeVisible();
  await expect(page.locator('#leadAccessBanner')).toContainText('Residential Lead Generator is a paid add-on preview');
  await expectPageFitsViewport(page);

  await openMobile(page, '/recruiting.html?role=member');
  await expect(page.locator('#recruitingAccessBanner')).toBeVisible();
  await expect(page.locator('#recruitingAccessBanner')).toContainText('Kira Recruit is a paid recruiting add-on.');
  await expect(page.getByRole('button', { name: 'Ask admin to enable' })).toBeVisible();
  await expectPageFitsViewport(page);
});
