// @ts-check
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/recruiting.html', { waitUntil: 'domcontentloaded' });
});

test('runs the auto recruiting workflow and creates a CRM feed', async ({ page }) => {
  await expect(page).toHaveTitle(/Kira Recruit/);
  await expect(page.getByRole('heading', { name: 'Auto recruiting' })).toBeVisible();
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

  await page.getByRole('button', { name: 'Book interviews' }).click();
  await page.getByRole('button', { name: 'Dashboard' }).click();
  await expect(page.locator('#bookedCount')).toHaveText('4');
  await page.getByRole('button', { name: 'Monday, Wednesday, Friday calls' }).click();
  await expect(page.locator('#interviewList')).toContainText('Alyssa Moreno');

  await page.getByRole('button', { name: 'Recruiting feed' }).click();
  await page.getByRole('button', { name: 'Sync CRM feed' }).click();
  await expect(page.locator('#feedMessage')).toContainText('CRM feed synced locally.');

  const feed = await page.evaluate(() => JSON.parse(localStorage.getItem('kiraRecruitingFeed-v1') || '{}'));
  expect(feed.app).toBe('Kira Recruit');
  expect(feed.recruits).toHaveLength(4);
  expect(feed.interviews).toHaveLength(4);
  expect(feed.interviews.map((interview) => new Date(interview.startsAt).getDay()).every((day) => [1, 3, 5].includes(day))).toBe(true);
});
