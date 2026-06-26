// @ts-check
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Pipeline command center' })).toBeVisible();
});

test('renders the CRM dashboard MVP', async ({ page }) => {
  await expect(page).toHaveTitle(/ClosePilot CRM/);
  await expect(page.getByRole('heading', { name: 'Pipeline command center' })).toBeVisible();
  await expect(page.locator('#pipelineBoard').getByText('Northstar Roofing')).toBeVisible();
  await expect(page.getByText('Create next-step tasks')).toBeVisible();
});

test('creates a lead and an automated follow-up task', async ({ page }) => {
  await page.getByRole('button', { name: '+ Lead' }).click();
  await expect(page.getByRole('dialog', { name: 'Add lead' })).toBeVisible();
  await page.getByLabel('Contact name').fill('Cameron Ellis');
  await page.getByLabel('Company').fill('Plus Growth Studio');
  await page.getByLabel('Deal value').fill('9600');
  await page.getByLabel('Stage').selectOption('proposal');
  await page.getByLabel('Source').fill('Trade show');
  await page.getByLabel('Next action').fill('Book discovery call');
  await page.getByLabel('Notes').fill('Wants a SaaS-ready CRM workflow.');
  await page.getByRole('button', { name: 'Create lead' }).click();

  await expect(page.locator('#pipelineBoard').getByText('Plus Growth Studio')).toBeVisible();
  await expect(page.getByText('Follow up with Cameron Ellis at Plus Growth Studio')).toBeVisible();
  await expect(page.locator('#leadBrief')).toContainText('Trade show');
  await expect(page.locator('#leadBrief')).toContainText('Book discovery call');
  await expect(page.locator('#leadBrief')).toContainText('Lead created from Trade show.');
  await expect(page.locator('#pipelineValue')).toContainText('$38,900');
});

test('moves a lead forward and updates the lead brief', async ({ page }) => {
  const northstarCard = page.locator('article.deal-card').filter({ hasText: 'Northstar Roofing' });
  await northstarCard.getByRole('button', { name: 'Next' }).click();

  await expect(page.getByText('Follow up with Maya Johnson after moving to Proposal')).toBeVisible();
  await expect(page.locator('#leadBrief')).toContainText('Proposal');
  await expect(page.locator('#leadBrief')).toContainText('Stage changed to Proposal.');
});

test('edits the selected lead', async ({ page }) => {
  await page.locator('#leadBrief').getByRole('button', { name: 'Edit lead' }).click();
  await expect(page.getByRole('dialog', { name: 'Edit lead' })).toBeVisible();
  await page.getByLabel('Company').fill('Northstar Exterior Group');
  await page.getByLabel('Deal value').fill('11400');
  await page.getByRole('button', { name: 'Save lead' }).click();

  await expect(page.locator('#leadBrief')).toContainText('Northstar Exterior Group');
  await expect(page.locator('#pipelineBoard').getByText('Northstar Exterior Group')).toBeVisible();
  await expect(page.locator('#pipelineValue')).toContainText('$32,300');
});

test('deletes the selected lead', async ({ page }) => {
  await page.locator('#leadBrief').getByRole('button', { name: 'Delete lead' }).click();

  await expect(page.locator('#pipelineBoard').getByText('Northstar Roofing')).toHaveCount(0);
  await expect(page.locator('#pipelineValue')).toContainText('$20,900');
});

test('creates a follow-up task from the selected lead', async ({ page }) => {
  await page.locator('#leadBrief').getByRole('button', { name: 'Add follow-up' }).click();

  await expect(page.locator('#taskList')).toContainText(
    'Send workflow proposal and ask for install calendar. (Northstar Roofing)',
  );
  await expect(page.locator('#leadBrief')).toContainText('Follow-up task added.');
});

test('starts an automated follow-up sequence for the selected lead', async ({ page }) => {
  await expect(page.locator('#leadBrief')).toContainText('Suggested sequence');
  await page.locator('#leadBrief').getByRole('button', { name: 'Start sequence' }).click();

  await expect(page.locator('#taskList')).toContainText(
    'Send workflow proposal and ask for install calendar. (Northstar Roofing)',
  );
  await expect(page.locator('#taskList')).toContainText(
    'Send Northstar Roofing a short proposal recap.',
  );
  await expect(page.locator('#taskList')).toContainText(
    'Ask Maya Johnson for timeline, blockers, and decision owner. (Northstar Roofing)',
  );
  await expect(page.locator('#leadBrief')).toContainText('3-step follow-up sequence started.');
});

test('imports leads from CSV', async ({ page }) => {
  const csv = [
    'name,company,stage,value,score,source,nextAction,notes',
    'Jordan Lee,Signal Labs,qualified,7200,83,CSV import,Schedule demo,Imported lead with strong fit',
  ].join('\n');

  await page.locator('#importLeadsInput').setInputFiles({
    name: 'leads.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(csv),
  });

  await expect(page.locator('#pipelineBoard').getByText('Signal Labs')).toBeVisible();
  await expect(page.locator('#leadBrief')).toContainText('Schedule demo');
  await expect(page.locator('#pipelineValue')).toContainText('$36,500');
});

test('exports leads to CSV', async ({ page }) => {
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export CSV' }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toBe('closepilot-leads.csv');
});

test('filters contacts and pipeline by search', async ({ page }) => {
  await page.getByPlaceholder('Search leads, companies, notes').fill('fitness');

  await expect(page.locator('#pipelineBoard').getByText('Harbor Fitness')).toBeVisible();
  await expect(page.locator('#pipelineBoard').getByText('Northstar Roofing')).toHaveCount(0);
});
