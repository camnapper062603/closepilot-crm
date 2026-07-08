// @ts-check
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/recruiting.html', { waitUntil: 'domcontentloaded' });
});

test('runs the auto recruiting workflow and creates a CRM feed', async ({ page }) => {
  await expect(page).toHaveTitle(/Kira Recruit/);
  await expect(page.getByRole('heading', { name: 'Auto recruiting' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Next best candidate action' })).toBeVisible();
  await expect(page.locator('.recruit-hero')).toContainText('coming soon recruiting preview');
  await expect(page.locator('.recruit-hero')).toContainText('Requires active ClosePilot CRM subscription');
  await expect(page.locator('.recruit-hero')).toContainText('AI recruiter');
  await expect(page.locator('.recruit-sidebar')).toHaveCount(0);
  await expect(page.locator('#recruitSubpageNav')).toContainText('Job details');

  await page.getByRole('button', { name: 'Job details' }).click();
  await page.getByRole('button', { name: 'List job' }).click();
  await expect(page.locator('#jobMessage')).toContainText('Job listed');

  await page.getByRole('button', { name: 'Dashboard' }).click();
  await expect(page.locator('#livePostings')).toHaveText('5');

  await page.getByRole('button', { name: 'Job board connectors' }).click();
  await expect(page.locator('#boardList')).toContainText('Indeed');
  await expect(page.locator('#boardList')).toContainText('Live');

  await page.getByRole('button', { name: 'Single candidate location' }).click();
  await page.getByRole('button', { name: 'Sync applicants' }).click();
  await page.getByRole('button', { name: 'Dashboard' }).click();
  await expect(page.locator('#applicantCount')).toHaveText('4');
  await page.getByRole('button', { name: 'Single candidate location' }).click();
  await expect(page.locator('#candidateList')).toContainText('Alyssa Moreno');
  await expect(page.locator('#candidateList')).toContainText('Priority candidate');
  await expect(page.locator('#candidateList')).toContainText('Call candidate first');

  await page.getByRole('button', { name: 'Book interviews' }).click();
  await page.getByRole('button', { name: 'Dashboard' }).click();
  await expect(page.locator('#bookedCount')).toHaveText('4');
  await page.getByRole('button', { name: 'Monday, Wednesday, Friday calls' }).click();
  await expect(page.locator('#interviewList')).toContainText('Alyssa Moreno');

  await page.getByRole('button', { name: 'Recruiting feed' }).click();
  await page.getByRole('button', { name: 'Sync CRM feed' }).click();
  await expect(page.locator('#feedMessage')).toContainText('CRM feed synced locally.');

  const feed = await page.evaluate(() => JSON.parse(localStorage.getItem('kiraRecruitingFeed-v1') || '{}'));
  const sharedFeed = await page.evaluate(() => JSON.parse(localStorage.getItem('kiraRecruitingSharedFeed-v1') || '{}'));
  expect(feed.app).toBe('Kira Recruit');
  expect(feed.recruits).toHaveLength(4);
  expect(feed.interviews).toHaveLength(4);
  expect(sharedFeed.app).toBe('Kira Recruit');
  expect(sharedFeed.recruits[0]).toMatchObject({
    name: 'Alyssa Moreno',
    role: 'Inside Sales Dialer',
    source: 'Indeed',
    interviewStatus: 'Booked',
  });
  expect(sharedFeed.recruits[0].nextAction).toContain('Prep interview call');
  expect(feed.interviews.map((interview) => new Date(interview.startsAt).getDay()).every((day) => [1, 3, 5].includes(day))).toBe(true);
});

test('shows a coming soon locked state for non-enabled members', async ({ page }) => {
  await page.goto('/recruiting.html?role=member', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('#syncMode')).toHaveText('Preview locked');
  await expect(page.locator('#recruitingAccessBanner')).toBeVisible();
  await expect(page.locator('#recruitingAccessBanner')).toContainText('Kira Recruit is coming soon');
  await expect(page.locator('#recruitingAccessBanner').getByRole('link', { name: 'View Demo' })).toHaveAttribute('href', '/recruiting.html?demo=1');

  await page.getByRole('button', { name: 'Job details' }).click();
  await page.getByRole('button', { name: 'List job' }).click();
  await expect(page.locator('#jobMessage')).toContainText('Kira Recruit is coming soon');

  await page.getByRole('button', { name: 'Recruiting feed' }).click();
  await page.getByRole('button', { name: 'Sync CRM feed' }).click();
  await expect(page.locator('#feedMessage')).toContainText('Kira Recruit is coming soon');
});

test('configures job board integrations and stages onboarding payroll', async ({ page }) => {
  await page.getByRole('button', { name: 'Integrations' }).click();
  await expect(page.getByRole('heading', { name: 'Indeed and MonsterZip integrations' })).toBeVisible();
  await page.locator('#integrationProvider').selectOption('indeed');
  await page.locator('#integrationAccountId').fill('indeed-account-123');
  await page.locator('#integrationEmail').fill('recruiting@kirahome.org');
  await page.locator('#integrationApiToken').fill('indeed-demo-token-9876');
  await page.locator('#integrationWebhookUrl').fill('https://kirahome.org/api/recruiting/applicants');
  await page.locator('#integrationBudget').fill('$35/day');
  await page.locator('#integrationNotes').fill('Texas inside sales campaign');
  await page.getByRole('button', { name: 'Save connector' }).click();
  await expect(page.locator('#integrationMessage')).toContainText('Indeed connector saved');
  await expect(page.locator('#integrationGrid')).toContainText('Token configured ••••9876');

  await page.getByRole('button', { name: 'Test connection' }).click();
  await expect(page.locator('#integrationMessage')).toContainText('Indeed connection test passed');
  await expect(page.locator('#integrationGrid')).toContainText('Connected');

  await page.locator('#integrationProvider').selectOption('monsterzip');
  await page.locator('#integrationAccountId').fill('monsterzip-456');
  await page.locator('#integrationEmail').fill('jobs@kirahome.org');
  await page.locator('#integrationApiToken').fill('monsterzip-demo-token-2222');
  await page.getByRole('button', { name: 'Save connector' }).click();
  await expect(page.locator('#integrationGrid')).toContainText('Monster / ZipRecruiter');
  await expect(page.locator('#integrationGrid')).toContainText('Token configured ••••2222');

  await page.getByRole('button', { name: 'W-2/W-9' }).click();
  await expect(page.getByRole('heading', { name: 'W-2 / W-9 onboarding packets' })).toBeVisible();
  await page.locator('#workerName').fill('Taylor Pay');
  await page.locator('#workerEmail').fill('taylor.pay@example.com');
  await page.locator('#workerType').selectOption('w9');
  await page.locator('#workerRole').fill('Appointment Setter');
  await page.locator('#workerPayRate').fill('$20/hr + commission');
  await page.locator('#workerNotes').fill('Packet only. Do not store 123-45-6789 here.');
  await page.getByRole('button', { name: 'Create packet' }).click();
  await expect(page.locator('#workerList')).toContainText('Taylor Pay');
  await expect(page.locator('#workerList')).toContainText('W-9 contractor');
  await expect(page.locator('#workerList')).toContainText('[redacted tax id]');
  await expect(page.locator('#onboardingSummary')).toContainText('Workers');
  await page.locator('#selectAllWorkers').click();
  await expect(page.locator('#selectedWorkerCount')).toHaveText('1 selected');
  await page.locator('#onboardingEmailTemplate').selectOption('tax');
  await page.locator('#bulkSendOnboarding').click();
  await expect(page.locator('#onboardingMessage')).toContainText('1 packet queued with the Tax packet reminder email.');
  await expect(page.locator('#workerList')).toContainText('Email queued');
  await page.getByRole('button', { name: 'Send packet link' }).click();
  await expect(page.locator('#onboardingMessage')).toContainText('Demo onboarding link staged');

  await page.getByRole('button', { name: 'Payroll' }).click();
  await expect(page.getByRole('heading', { name: 'Employee and contractor payments' })).toBeVisible();
  await page.locator('#payrollCompanyId').fill('gusto-company-123');
  await page.locator('#payrollApiToken').fill('payroll-demo-token-4321');
  await page.getByRole('button', { name: 'Save payroll provider' }).click();
  await expect(page.locator('#payrollMessage')).toContainText('Gusto payroll provider saved');

  await page.locator('#payrollWorker').selectOption({ label: 'Taylor Pay (W9)' });
  await page.locator('#payrollPeriod').fill('Jul 1-Jul 15');
  await page.locator('#payrollHours').fill('10');
  await page.locator('#payrollRate').fill('20');
  await page.locator('#payrollBonus').fill('50');
  await page.locator('#payrollReimbursement').fill('5');
  await expect(page.locator('#payrollTotal')).toHaveText('$255.00');
  await page.getByRole('button', { name: 'Stage payroll run' }).click();
  await expect(page.locator('#payrollList')).toContainText('Taylor Pay');
  await expect(page.locator('#payrollList')).toContainText('$255.00');
  await expect(page.locator('#payrollList')).toContainText('Staged');
  await expect(page.locator('#payrollSummary')).toContainText('$255.00');
  await page.locator('#selectAllPayrollRuns').click();
  await expect(page.locator('#selectedPayrollCount')).toHaveText('1 selected');
  await page.locator('#emailPayrollRuns').click();
  await expect(page.locator('#payrollMessage')).toContainText('1 summary queued with the Payment summary email.');
  await expect(page.locator('#payrollList')).toContainText('Email queued');
  await page.locator('#markSelectedPayrollPaid').click();
  await expect(page.locator('#payrollMessage')).toContainText('1 payroll run marked paid in demo mode');
  await expect(page.locator('#payrollList')).toContainText('Paid');
});
