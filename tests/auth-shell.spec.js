// @ts-check
import { test, expect } from '@playwright/test';

async function useRuntimeConfig(page, overrides = {}) {
  const config = {
    appMode: 'production',
    publicDemoEnabled: true,
    supabaseUrl: '',
    supabaseAnonKey: '',
    stripeCheckoutUrl: '',
    stripePortalUrl: '',
    supportEmail: 'support@kira.local',
    inviteFromEmail: '',
    productUrl: '',
    appBaseUrl: 'https://kirahome.org',
    ...overrides,
  };
  await page.route('**/config.js', (route) =>
    route.fulfill({
      contentType: 'application/javascript',
      body: `window.ClosePilotConfig = ${JSON.stringify(config)};`,
    }),
  );
}

test('unauthenticated root shows only the clean login shell', async ({ page }) => {
  await useRuntimeConfig(page, { publicDemoEnabled: true });
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/', { waitUntil: 'load' });

  await expect(page.locator('#authPanel')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Sign in to your app' })).toBeVisible();
  await expect(page.locator('.app-shell')).toBeHidden();
  await expect(page.locator('#homePanel')).toBeHidden();
  await expect(page.locator('#accessDeniedPanel')).toBeHidden();
  await expect(page.locator('#dailyCommandCenter')).toBeHidden();
  await expect(page.getByRole('button', { name: 'View Demo Workspace' })).toBeVisible();
});

test('public demo button appears only when public demo is enabled', async ({ page }) => {
  await useRuntimeConfig(page, { publicDemoEnabled: false });
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/', { waitUntil: 'load' });

  await expect(page.locator('#authPanel')).toBeVisible();
  await expect(page.getByRole('button', { name: 'View Demo Workspace' })).toHaveCount(0);
  await expect(page.locator('.auth-demo-card')).toBeHidden();
  await expect(page.locator('.app-shell')).toBeHidden();
});

test('dashboard renders after intentional demo entry', async ({ page }) => {
  await useRuntimeConfig(page, { publicDemoEnabled: true });
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/?demo=1', { waitUntil: 'load' });

  await expect(page.locator('.app-shell')).toBeVisible();
  await expect(page.locator('.topbar h1')).toHaveText('Dashboard');
  await expect(page.locator('#modePill')).toHaveText('Demo workspace');
  await expect(page.locator('#dailyCommandCenter')).toBeVisible();
});
