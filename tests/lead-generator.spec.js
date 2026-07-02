// @ts-check
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/SafeLeadGenerator-Standalone.html', { waitUntil: 'domcontentloaded' });
});

test('opens the lead generator cost planner and estimates paid stack costs', async ({ page }) => {
  await expect(page).toHaveTitle(/Safe Property Lead Generator/);
  await expect(page.getByRole('heading', { name: 'Compliant Property Lead Builder' })).toBeVisible();

  await page.getByRole('button', { name: 'Cost planner' }).click();
  await expect(page.getByRole('heading', { name: 'Auto residential lead cost planner' })).toBeVisible();
  await expect(page.locator('.sidebar')).toBeHidden();
  await expect(page.locator('#costStackRows')).toContainText('BatchLeads Growth/skip trace');
  await expect(page.locator('#costStackRows')).toContainText('Texas No-Call list');
  await expect(page.locator('[data-cost-category="propertyInfo"]')).toContainText('Property info');
  await expect(page.locator('#costStackRows')).toContainText('ATTOM Property Navigator');
  await expect(page.locator('#costStackRows')).toContainText('PropStream');
  await expect(page.locator('[data-cost-category="skipTracers"]')).toContainText('Skip tracers');
  await expect(page.locator('#costStackRows')).toContainText('BatchData Growth/API');
  await expect(page.locator('[data-cost-category="dncLists"]')).toContainText('DNC lists and compliance');
  await expect(page.locator('#costStackRows')).toContainText('DNC scrub vendor/API');
  await expect(page.locator('#estimatedSafeLeads')).toHaveText('6,560-7,790');
  await expect(page.locator('#totalMonthlyCost')).toHaveText('$590.00');
  await expect(page.locator('#costPerLead')).toHaveText('$0.08-$0.09');

  await page.locator('#costRecordsInput').fill('20000');
  await expect(page.locator('#estimatedSafeLeads')).toHaveText('13,120-15,580');
  await expect(page.locator('#totalMonthlyCost')).toHaveText('$590.00');

  await page.getByRole('button', { name: 'Generator' }).click();
  await expect(page.locator('.sidebar')).toBeVisible();
  await expect(page.locator('#leadRows')).toBeVisible();
});

test('imports Redfin or Zillow style property exports without scraping', async ({ page }) => {
  await page.locator('#portalFile').setInputFiles({
    name: 'redfin-export.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(
      [
        'SALE TYPE,SOLD DATE,PROPERTY TYPE,ADDRESS,CITY,STATE OR PROVINCE,ZIP OR POSTAL CODE,PRICE,BEDS,BATHS,LOT SIZE,YEAR BUILT,STATUS,MLS#,SOURCE',
        'MLS Listing,,Single Family Residential,1200 Sample Oak Dr,Austin,TX,78704,425000,3,2,6500,1985,Active,TXMLS-1001,Redfin export',
        'MLS Listing,,Single Family Residential,44 Portal Bend,Houston,TX,77002,310000,3,2,5200,1992,Active,TXMLS-1002,Zillow API export',
      ].join('\n'),
    ),
  });

  await expect(page.locator('#propertyCount')).toHaveText('2');
  await expect(page.locator('#statusMessage')).toContainText('Zillow/Redfin export row(s) imported');

  await page.getByRole('button', { name: 'Generate residential mail leads' }).click();
  await expect(page.locator('#leadRows')).toContainText('1200 Sample Oak Dr');
  await expect(page.locator('#leadRows')).toContainText('Property records only - needs BatchLeads skip trace');
});
