// @ts-check
import { readFile } from 'node:fs/promises';
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/', { waitUntil: 'load' });
  await expect(page.locator('.topbar h1')).toHaveText('Dashboard');
});

async function navigateTo(page, label, hash) {
  const headings = {
    Admin: 'Workspace admin',
    Calendar: 'Calendar',
    Dial: 'Dial floor',
    Dashboard: 'Dashboard',
  };
  await page.getByRole('link', { name: label }).click();
  await expect(page).toHaveURL(new RegExp(`#${hash}`));
  await expect(page.locator('.topbar h1')).toHaveText(headings[label] || label);
}

async function openSubpage(page, label) {
  const nav = page.locator('#subpageNav');
  await expect(nav).toContainText(label);
  await nav.getByRole('button', { name: label, exact: true }).click();
}

async function openDashboardOverview(page) {
  await openSubpage(page, 'Dashboard');
  await expect(page.locator('#pipeline')).toBeVisible();
}

async function openLeadBrief(page) {
  await openSubpage(page, 'Lead brief');
  await expect(page.locator('#leadBrief')).toBeVisible();
  return page.locator('#leadBrief');
}

async function openAutomationSubpage(page, label) {
  await openSubpage(page, label);
  await expect(page.locator('#automation')).toBeVisible();
}

async function openBackupCenter(page) {
  await openSubpage(page, 'Backup center');
  await expect(page.locator('#workspaceBackup')).toBeVisible();
}

async function installRecruitingFeed(page) {
  await page.evaluate(() => {
    const feed = {
      app: 'Kira Recruit',
      version: 1,
      syncedAt: new Date().toISOString(),
      job: { title: 'Inside Sales Dialer' },
      recruits: [
        {
          id: 'candidate-alyssa',
          externalId: 'candidate-alyssa',
          name: 'Alyssa Moreno',
          email: 'alyssa.moreno@example.com',
          phone: '(512) 555-0142',
          role: 'Inside Sales Dialer',
          source: 'Indeed',
          interviewStatus: 'Booked',
          score: 94,
          nextAction: 'Prep interview call for Wednesday.',
          experience: '2 years appointment setting, Spanish bilingual',
          skills: ['Phone confidence', 'CRM notes'],
          syncedAt: new Date().toISOString(),
        },
        {
          id: 'candidate-derek',
          externalId: 'candidate-derek',
          name: 'Derek Shaw',
          email: 'derek.shaw@example.com',
          phone: '(214) 555-0188',
          role: 'Inside Sales Dialer',
          source: 'LinkedIn',
          interviewStatus: 'Qualified',
          score: 89,
          nextAction: 'Call candidate and confirm availability.',
          experience: 'Former SDR with outbound sales and daily CRM logging',
          skills: ['Outbound', 'CRM experience'],
          syncedAt: new Date().toISOString(),
        },
      ],
      interviews: [],
    };
    localStorage.setItem('kiraRecruitingFeed-v1', JSON.stringify(feed));
  });
}

test('renders the CRM dashboard MVP', async ({ page }) => {
  test.setTimeout(60_000);

  await expect(page).toHaveTitle(/Kira Home/);
  await expect(page.locator('.topbar h1')).toHaveText('Dashboard');
  await expect(page.locator('#dailyCommandCenter')).toContainText('Good Morning, Cameron');
  await expect(page.locator('#dailyCommandCenter')).toContainText("Today's focus");
  await expect(page.getByRole('button', { name: 'Start My Day' })).toBeVisible();
  await expect(page.locator('#dashboardFollowUpQueueCard')).toContainText('Follow-Ups Due');
  await expect(page.locator('#dashboardFollowUpQueueCount')).toHaveText(/\d+/);
  await expect(page.getByRole('button', { name: 'Open Follow-Up Queue' })).toBeVisible();
  await expect(page.locator('#communicationStatsWidget')).toContainText('Conversation command center');
  await expect(page.locator('#communicationDashboardStats')).toContainText('Calls today');
  await expect(page.locator('#communicationDashboardStats')).toContainText('Texts logged today');
  await expect(page.locator('#communicationDashboardStats')).toContainText('Emails logged today');
  await expect(page.locator('#communicationDashboardStats')).toContainText('Missed follow-ups');
  await expect(page.locator('#communicationDashboardStats')).toContainText('Average response time');
  await expect(page.locator('#communicationDashboardStats')).toContainText('Needs attention');
  await expect(page.locator('#timeSavedWidget')).toContainText('Time Saved');
  await expect(page.locator('#dashboardTimeSavedToday')).toHaveText(/\d+(h( \d+m)?|m)/);
  await expect(page.locator('#dashboardTimeSavedSources')).toContainText('Smart Lead Prioritization');
  await expect(page.locator('#timeSavedWidget')).toContainText('Team Time Saved');
  await expect(page.locator('#dashboardRecommendations')).toContainText('Call this homeowner first');
  await expect(page.locator('#dashboardRecommendations')).toContainText('This estimate is likely to close');
  await expect(page.locator('#dashboardSchedule')).toContainText('Focus block');
  await expect(page.locator('#pipelineBoard').getByText('Northstar Roofing')).toBeVisible();

  await page.getByRole('button', { name: 'Start My Day' }).click();
  await expect(page.locator('#flowModePanel')).toBeVisible();
  await expect(page.locator('#flowModePanel')).toContainText("Today's Sales Flow");
  await expect(page.locator('#flowProgressLabel')).toContainText('1 of 18 priority actions');
  await expect(page.locator('#flowTimeSavedToday')).toHaveText('0m');
  await expect(page.locator('#flowTalkingPoints')).toContainText('Ask for the next concrete step');
  await expect(page.locator('#flowLeadDetails')).toContainText('Lead Intelligence Score');
  await expect(page.locator('#flowLeadDetails')).toContainText(/Hot|Warm|Nurture|Cold/);
  await expect(page.locator('#flowLeadDetails')).toContainText('Recommended action');
  await expect(page.locator('#flowLeadDetails')).toContainText('Top score factors');

  await navigateTo(page, 'Automations', 'automation');
  await expect(page.getByText('Create next-step tasks')).toBeVisible();
});

test('opens the public marketer demo workspace with sample operating data', async ({ page }) => {
  await page.goto('/?demo=1', { waitUntil: 'load' });

  await expect(page.locator('.topbar h1')).toHaveText('Dashboard');
  await expect(page.locator('#modePill')).toHaveText('Demo workspace');
  await expect(page.locator('#signOutButton')).toHaveText('Exit demo');
  await expect(page.locator('#workspaceNameLabel')).toHaveText('Kira Home Demo Co');
  await expect(page.locator('#dailyCommandCenter')).toContainText('What should I do next?');
  await expect(page.locator('#hotLeadCount')).toHaveText(/[1-9]/);
  await expect(page.locator('#dashboardAppointmentsToday')).toHaveText(/[1-9]/);
  await expect(page.locator('#dashboardRecommendations')).toContainText('Maya Johnson');

  await navigateTo(page, 'Communications', 'communications');
  await expect(page.locator('#conversationList')).toContainText('Maya Johnson');
  await expect(page.locator('#conversationList')).toContainText('Caleb Stone');

  await navigateTo(page, 'Recruiting Inbox', 'recruiting');
  await expect(page.locator('#recruitingCandidateList')).toContainText('Alyssa Moreno');
  await expect(page.locator('#recruitingCandidateList')).toContainText('Indeed');

  await page.getByRole('button', { name: 'Exit demo' }).click();
  await expect(page.locator('#authPanel')).toBeVisible();
  await expect(page.locator('#authMessage')).toContainText('Demo closed');
});

test('lands users on role-specific first pages', async ({ page }) => {
  const applyRoleLanding = async (role, teamFunction) => {
    await page.evaluate(
      ({ role: nextRole, teamFunction: nextFunction }) => {
        localStorage.setItem('closepilot-demo-role', nextRole);
        if (nextFunction) {
          localStorage.setItem('closepilot-demo-function', nextFunction);
        } else {
          localStorage.removeItem('closepilot-demo-function');
        }
        history.replaceState(null, '', window.location.pathname);
        window.dispatchEvent(new Event('hashchange'));
      },
      { role, teamFunction },
    );
  };

  await applyRoleLanding('member', 'dialer');
  await expect(page.locator('.topbar h1')).toHaveText('Dial floor');
  await expect(page).toHaveURL(/#dial$/);

  await applyRoleLanding('member', 'closer');
  await expect(page.locator('.topbar h1')).toHaveText('Calendar');
  await expect(page).toHaveURL(/#calendar$/);

  await applyRoleLanding('manager', '');
  await expect(page.locator('.topbar h1')).toHaveText('Dashboard');
  await expect(page).toHaveURL(/#pipeline$/);
});

test('guides Start My Day through Flow Mode actions', async ({ page }) => {
  test.setTimeout(60_000);

  await page.getByRole('button', { name: 'Start My Day' }).click();

  await expect(page.locator('#flowModePanel')).toBeVisible();
  await expect(page.locator('#flowProgressLabel')).toHaveText('1 of 18 priority actions');
  await expect(page.locator('#flowActionTitle')).toContainText(/Follow up with/);
  await expect(page.locator('#flowActionWhy')).toContainText('Follow-up reason:');
  await expect(page.locator('#flowActionButtons')).toContainText('Call Lead');
  await expect(page.locator('#flowActionButtons')).toContainText('Send Text');
  await expect(page.locator('#flowActionButtons')).toContainText('Book Appointment');
  await expect(page.locator('#flowLeadDetails')).toContainText('Deal value');
  await expect(page.locator('#flowLeadDetails')).toContainText('Lead Intelligence Score');
  await expect(page.locator('#flowLeadDetails')).toContainText('Recommended action');
  await expect(page.locator('#flowLeadDetails')).toContainText(/Hot|Warm|Nurture|Cold/);
  await expect(page.locator('#flowTimeSavedToday')).toHaveText('0m');

  await page.getByRole('button', { name: 'Call Lead' }).click();
  await expect(page.locator('#flowActionStatus')).toContainText('Call Lead selected');
  await page.getByRole('button', { name: 'Complete & Next' }).click();
  await expect(page.locator('#flowCallsCompleted')).toHaveText('1');
  await expect(page.locator('#flowTimeSavedMessage')).toContainText(/\+\d+m saved/);
  await expect(page.locator('#flowTimeSavedMessage')).toContainText('saved today');
  await expect(page.locator('#flowTimeSavedToday')).not.toHaveText('0m');
  await expect(page.locator('#flowProgressLabel')).toHaveText('2 of 18 priority actions');

  await page.getByRole('button', { name: 'Send Text' }).click();
  await page.getByRole('button', { name: 'Complete & Next' }).click();
  await expect(page.locator('#flowFollowUpsCompleted')).toHaveText('1');
  await expect(page.locator('#flowProgressLabel')).toHaveText('3 of 18 priority actions');

  await page.getByRole('button', { name: 'Book Appointment' }).click();
  await page.getByRole('button', { name: 'Complete & Next' }).click();
  await expect(page.locator('#flowAppointmentsBooked')).toHaveText('1');
  await expect(page.locator('#flowProgressLabel')).toHaveText('4 of 18 priority actions');

  await page.getByRole('button', { name: 'Skip' }).click();
  await expect(page.locator('#flowProgressLabel')).toHaveText('5 of 18 priority actions');

  for (let index = 0; index < 14; index += 1) {
    await page.getByRole('button', { name: 'Complete & Next' }).click();
  }

  await expect(page.locator('#flowCompletionState')).toBeVisible();
  await expect(page.locator('#flowCompletionState')).toContainText('Mission Complete');
  await expect(page.locator('#flowCompletionResults')).toContainText('Appointments booked');
  await expect(page.locator('#flowCompletionResults')).toContainText('Total estimated time saved');
  await expect(page.locator('#flowCompletionResults')).toContainText('Estimated revenue influenced');
});

test('opens and completes smart follow-ups from the queue', async ({ page }) => {
  await page.getByRole('button', { name: 'Open Follow-Up Queue' }).click();

  const queue = page.locator('#followUpQueue');
  await expect(queue).toBeVisible();
  await expect(page.locator('#pipeline')).toBeHidden();
  await expect(queue).toContainText('Follow-Up Queue');
  await expect(queue.locator('.follow-up-item')).toHaveCount(3);
  await expect(queue).toContainText(/No contact in 3\+ days|Estimate sent but not closed|Hot lead not contacted|Customer opened estimate placeholder/);
  await expect(queue).toContainText('Suggested message');
  await expect(queue).toContainText('Recommended action');
  await expect(queue).toContainText('Lead score');
  await expect(queue).toContainText(/Critical|High|Medium/);

  const firstItem = queue.locator('.follow-up-item').first();
  await firstItem.getByRole('button', { name: 'Mark Complete' }).click();

  await expect(page.locator('#followUpQueueMessage')).toContainText('follow-up marked complete');
  await expect(page.locator('#followUpQueueMessage')).toContainText('saved');
  await expect(queue.locator('.follow-up-item')).toHaveCount(2);
});

test('opens primary sidebar items as separate app pages', async ({ page }) => {
  await expect(page.locator('#pipeline')).toBeVisible();
  await expect(page.locator('#contacts')).toBeHidden();

  await navigateTo(page, 'AI Sales Manager', 'manager');
  await expect(page.locator('#aiSalesManagerPage')).toBeVisible();
  await expect(page.locator('#pipeline')).toBeHidden();

  await navigateTo(page, 'Contacts', 'contacts');
  await expect(page.locator('#contacts')).toBeVisible();
  await expect(page.locator('#aiSalesManagerPage')).toBeHidden();

  await navigateTo(page, 'Recruiting Inbox', 'recruiting');
  await expect(page.locator('#recruitingInbox')).toBeVisible();
  await expect(page.locator('#contacts')).toBeHidden();

  await navigateTo(page, 'Automations', 'automation');
  await expect(page.locator('#automation')).toBeVisible();
  await expect(page.locator('#recruitingInbox')).toBeHidden();

  await navigateTo(page, 'Tasks', 'tasks');
  await expect(page.locator('#tasks')).toBeVisible();
  await expect(page.locator('#automation')).toBeHidden();

  await navigateTo(page, 'Activity', 'activity');
  await expect(page.locator('#activity')).toBeVisible();
  await expect(page.locator('#tasks')).toBeHidden();

  await navigateTo(page, 'Communications', 'communications');
  await expect(page.locator('#communicationsPage')).toBeVisible();
  await expect(page.locator('#activity')).toBeHidden();

  await navigateTo(page, 'Dial', 'dial');
  await expect(page.locator('#dial')).toBeVisible();
  await expect(page.locator('#communicationsPage')).toBeHidden();

  await navigateTo(page, 'Calendar', 'calendar');
  await expect(page.locator('#calendar')).toBeVisible();
  await expect(page.locator('#dial')).toBeHidden();

  await navigateTo(page, 'Admin', 'admin');
  await expect(page.locator('#saasAdmin')).toBeVisible();
  await expect(page.locator('#calendar')).toBeHidden();

  await navigateTo(page, 'Settings', 'settings');
  await expect(page.locator('#saasAdmin')).toBeVisible();
  await expect(page.locator('.topbar h1')).toHaveText('Settings');
});

test('syncs Kira Recruit candidates into the CRM Recruiting Inbox', async ({ page }) => {
  await installRecruitingFeed(page);

  const hasSupabaseKeys = await page.evaluate(() => Boolean(window.KiraHomeConfig?.supabaseUrl && window.KiraHomeConfig?.supabaseAnonKey));
  expect(hasSupabaseKeys).toBe(false);

  await navigateTo(page, 'Recruiting Inbox', 'recruiting');
  await expect(page.locator('#recruitingInbox')).toBeVisible();
  await expect(page.locator('#recruitingCandidateList')).toContainText('Alyssa Moreno');
  await expect(page.locator('#recruitingCandidateList')).toContainText('Inside Sales Dialer');
  await expect(page.locator('#recruitingCandidateList')).toContainText('Indeed');
  await expect(page.locator('#recruitingCandidateList')).toContainText('Booked');
  await expect(page.locator('#recruitingCandidateList')).toContainText('94');
  await expect(page.locator('#recruitingCandidateList')).toContainText('Prep interview call');

  await page.getByRole('button', { name: 'Refresh Feed' }).click();
  await expect(page.locator('#recruitingInboxMessage')).toContainText('2 Kira Recruit candidate records synced');

  const alyssa = page.locator('[data-recruit-candidate-card="candidate-alyssa"]');
  await alyssa.getByRole('button', { name: 'Convert to CRM contact/lead' }).click();
  await expect(page.locator('#recruitingInboxMessage')).toContainText('Alyssa Moreno converted');
  await expect(alyssa).toContainText('Converted to CRM');

  const derek = page.locator('[data-recruit-candidate-card="candidate-derek"]');
  await derek.getByRole('button', { name: 'Create follow-up task' }).click();
  await expect(page.locator('#recruitingInboxMessage')).toContainText('Follow-up task created for Derek Shaw');
  await derek.getByRole('button', { name: 'Mark as reviewed' }).click();
  await expect(page.locator('#recruitingInboxMessage')).toContainText('Derek Shaw marked as reviewed');
  await expect(derek).toContainText('Reviewed');

  await navigateTo(page, 'Contacts', 'contacts');
  await page.getByPlaceholder('Search leads, companies, notes').fill('Alyssa');
  await expect(page.locator('#contactTable')).toContainText('Alyssa Moreno');
  await expect(page.locator('#contactTable')).toContainText('Kira Recruit');

  await navigateTo(page, 'Tasks', 'tasks');
  await page.getByPlaceholder('Search leads, companies, notes').fill('');
  await page.getByPlaceholder('Search task text').fill('Alyssa');
  await expect(page.locator('#taskList')).toContainText('Follow up with Alyssa Moreno from Kira Recruit');
  await page.getByPlaceholder('Search task text').fill('Derek');
  await expect(page.locator('#taskList')).toContainText('Follow up with recruiting candidate Derek Shaw');

  await navigateTo(page, 'Activity', 'activity');
  await page.getByPlaceholder('Search activity').fill('Kira Recruit');
  await expect(page.locator('#activityFeed')).toContainText('Imported 2 candidates from Kira Recruit');
  await expect(page.locator('#activityFeed')).toContainText('Alyssa Moreno converted from Kira Recruit');
  await page.getByPlaceholder('Search activity').fill('Derek');
  await expect(page.locator('#activityFeed')).toContainText('Recruiting follow-up task created for Derek Shaw');
});

test('renders Opportunity Health scores and dashboard recommendations', async ({ page }) => {
  await expect(page.locator('#opportunityHealthWidget')).toContainText('Opportunity Health');
  await expect(page.locator('#opportunityHealthDashboard')).toContainText('Hot opportunities');
  await expect(page.locator('#opportunityHealthDashboard')).toContainText('At-risk opportunities');
  await expect(page.locator('#opportunityHealthDashboard')).toContainText('Overdue follow-ups');
  await expect(page.locator('#opportunityHealthDashboard')).toContainText('Best next lead to contact');
  await expect(page.getByRole('button', { name: 'Open Best Lead' })).toBeEnabled();

  await expect(page.locator('#pipelineBoard .opportunity-health-badge').first()).toContainText(/Hot|Warm|At Risk|Cold/);

  await openLeadBrief(page);
  await expect(page.locator('#leadBrief')).toContainText('Opportunity Health');
  await expect(page.locator('#leadBrief')).toContainText('Recommended Next Action');
  await expect(page.locator('#leadBrief')).toContainText('Why this score?');
  await expect(page.locator('#leadBrief')).toContainText(/Hot|Warm|At Risk|Cold/);

  await page.locator('#leadBrief').getByRole('button', { name: 'Open details' }).click();
  await expect(page.locator('#leadDetailContent')).toContainText('Opportunity Health');
  await expect(page.locator('#leadDetailContent')).toContainText('Recommended Next Action');
  await expect(page.locator('#leadDetailContent')).toContainText('Last contact');
});

test('renders AI Sales Copilot suggestions and runs Copilot actions', async ({ page }) => {
  const dashboardCopilot = page.locator('#dashboardSalesCopilotCard');
  await expect(dashboardCopilot).toContainText('AI Sales Copilot');
  await expect(dashboardCopilot).toContainText('Deterministic fallback');
  await expect(dashboardCopilot).toContainText('Roofing');
  await expect(dashboardCopilot).toContainText('Urgent');
  await expect(dashboardCopilot).toContainText('Best next action');
  await expect(dashboardCopilot).toContainText('Suggested call opener');
  await expect(dashboardCopilot).toContainText('Suggested text message');
  await expect(dashboardCopilot).toContainText('Suggested follow-up email');
  await expect(dashboardCopilot).toContainText('Main objection risk');
  await expect(dashboardCopilot).toContainText('Close probability explanation');

  await dashboardCopilot.getByRole('button', { name: 'Copy Text' }).click();
  await expect(dashboardCopilot.locator('.sales-copilot-status')).toContainText('Suggested text copied');
  const copiedText = await page.evaluate(() => localStorage.getItem('closepilot-copilot-clipboard'));
  expect(copiedText).toContain('Kira Home');

  await dashboardCopilot.getByRole('button', { name: 'Create Task' }).click();
  await expect(dashboardCopilot.locator('.sales-copilot-status')).toContainText('Copilot task created');
  await navigateTo(page, 'Tasks', 'tasks');
  await page.getByPlaceholder('Search task text').fill('Copilot');
  await expect(page.locator('#taskList')).toContainText('Copilot:');

  await navigateTo(page, 'Dashboard', 'pipeline');
  await dashboardCopilot.getByRole('button', { name: 'Log Activity' }).click();
  await expect(dashboardCopilot.locator('.sales-copilot-status')).toContainText('Copilot activity logged');
  await navigateTo(page, 'Activity', 'activity');
  await page.getByPlaceholder('Search activity').fill('AI Sales Copilot recommendation');
  await expect(page.locator('#activityFeed')).toContainText('AI Sales Copilot recommendation logged');

  await navigateTo(page, 'Dashboard', 'pipeline');
  await openLeadBrief(page);
  await page.locator('#leadBrief').getByRole('button', { name: 'Open details' }).click();
  const dialog = page.getByRole('dialog', { name: 'Northstar Roofing' });
  await expect(dialog).toContainText('AI Sales Copilot');
  await expect(dialog).toContainText('Best next action');
  await dialog.locator('.sales-copilot-panel').getByRole('button', { name: 'Move Lead Stage' }).click();
  await expect(dialog.locator('.sales-copilot-status')).toContainText('Copilot moved Northstar Roofing to Proposal');
  await expect(dialog).toContainText('Proposal deal');
});

test('shows the AI Sales Manager owner dashboard', async ({ page }) => {
  await navigateTo(page, 'AI Sales Manager', 'manager');

  await expect(page.locator('#aiSalesManagerPage')).toBeVisible();
  await expect(page.locator('#managerKpiGrid')).toContainText("Today's Revenue");
  await expect(page.locator('#managerKpiGrid')).toContainText('Revenue This Month');
  await expect(page.locator('#managerKpiGrid')).toContainText('Appointments Set');
  await expect(page.locator('#managerKpiGrid')).toContainText('Closing Rate');
  await expect(page.locator('#managerKpiGrid')).toContainText('Average Deal Size');
  await expect(page.locator('#managerKpiGrid')).toContainText('Pipeline Value');
  await expect(page.locator('#managerKpiGrid')).toContainText('Deals at Risk');
  await expect(page.locator('#managerKpiGrid')).toContainText('Average Response Time');

  await expect(page.locator('#salesLeaderboard')).toContainText('John Carter');
  await expect(page.locator('#salesLeaderboard')).toContainText('Revenue Closed');
  await expect(page.locator('#salesLeaderboard')).toContainText('AI Performance Score');
  await expect(page.locator('#salesLeaderboard')).toContainText('Trend Indicator');

  await expect(page.locator('#managerAIInsights')).toContainText("John has a 92% close rate this week.");
  await expect(page.locator('#managerAIInsights')).toContainText('leads have gone untouched for 3 days');
  await expect(page.locator('#managerAIInsights')).toContainText('Roofing pipeline is slowing');
  await expect(page.locator('#managerAIInsights')).toContainText('Bathroom remodels are closing 21% higher');

  await expect(page.locator('#forecastCharts')).toContainText('Expected Revenue');
  await expect(page.locator('#forecastCharts')).toContainText('Likely Revenue');
  await expect(page.locator('#forecastCharts')).toContainText('Best Case');
  await expect(page.locator('#forecastCharts')).toContainText('Worst Case');
  await expect(page.locator('#forecastCharts')).toContainText('Next 30 Days');
  await expect(page.locator('#forecastCharts')).toContainText('Next 90 Days');

  await expect(page.locator('#managerPipelineHealth')).toContainText('New Leads');
  await expect(page.locator('#managerPipelineHealth')).toContainText('Qualified');
  await expect(page.locator('#managerPipelineHealth')).toContainText('Quoted');
  await expect(page.locator('#managerPipelineHealth')).toContainText('Negotiating');
  await expect(page.locator('#managerPipelineHealth')).toContainText('Won');
  await expect(page.locator('#managerPipelineHealth')).toContainText('Lost');
  await expect(page.locator('#managerPipelineHealth')).toContainText('Stalled');

  await expect(page.locator('#coachingPanel')).toContainText('Strengths');
  await expect(page.locator('#coachingPanel')).toContainText('Weaknesses');
  await expect(page.locator('#coachingPanel')).toContainText('Recommended Focus');
  await expect(page.locator('#coachingPanel')).toContainText('Suggested Script Improvements');
  await expect(page.locator('#coachingPanel')).toContainText('Objection Coaching');
  await expect(page.locator('#coachingPanel')).toContainText('Follow-up Score');

  await expect(page.locator('#riskCenter')).toContainText('Deals likely to be lost');
  await expect(page.locator('#riskCenter')).toContainText('Inactive leads');
  await expect(page.locator('#riskCenter')).toContainText('Overdue follow-ups');
  await expect(page.locator('#riskCenter')).toContainText('Missed appointments');
  await expect(page.locator('#riskCenter')).toContainText('Declining sales reps');
  await expect(page.locator('#riskCenter')).toContainText('Missing estimates');

  await expect(page.locator('#managerActionsPanel')).toContainText('Assign Leads');
  await expect(page.locator('#managerActionsPanel')).toContainText('Reassign Leads');
  await expect(page.locator('#managerActionsPanel')).toContainText('Send Coaching Message');
  await expect(page.locator('#managerActionsPanel')).toContainText('Create Team Challenge');
  await expect(page.locator('#managerActionsPanel')).toContainText('Schedule Meeting');

  await expect(page.locator('#managerNotifications')).toContainText('Large deal created');
  await expect(page.locator('#managerNotifications')).toContainText('High-value lead inactive');
  await expect(page.locator('#managerNotifications')).toContainText('Sales rep falling behind');
  await expect(page.locator('#managerNotifications')).toContainText('Pipeline goal reached');
  await expect(page.locator('#managerNotifications')).toContainText('Revenue milestone');

  await expect(page.locator('#managerAnalyticsTabs')).toContainText('Revenue');
  await expect(page.locator('#managerAnalyticsTabs')).toContainText('Appointments');
  await expect(page.locator('#managerAnalyticsTabs')).toContainText('Close Rate');
  await expect(page.locator('#managerAnalyticsTabs')).toContainText('Lead Sources');
  await expect(page.locator('#managerAnalyticsTabs')).toContainText('Rep Performance');
  await expect(page.locator('#managerAnalyticsTabs')).toContainText('Customer Response Time');

  await page.getByRole('button', { name: 'Lead Sources' }).click();
  await expect(page.locator('#managerAnalyticsChart')).toContainText('Best source mix by pipeline value');

  await page.getByRole('button', { name: 'Assign Leads', exact: true }).click();
  await expect(page.locator('#managerStatus')).toContainText('Assign Leads queued');

  await page.getByRole('button', { name: 'Refresh AI Insights' }).click();
  await expect(page.locator('#managerStatus')).toContainText('AI insights refreshed');
});

test('runs the unified communications center', async ({ page }) => {
  await navigateTo(page, 'Communications', 'communications');

  await expect(page.locator('#communicationsPage')).toBeVisible();
  await expect(page.locator('#conversationList').locator('.conversation-item')).toHaveCount(4);
  await expect(page.locator('#communicationSearch')).toBeVisible();
  await expect(page.locator('.communication-filters')).toContainText('All');
  await expect(page.locator('.communication-filters')).toContainText('Calls');
  await expect(page.locator('.communication-filters')).toContainText('Texts');
  await expect(page.locator('.communication-filters')).toContainText('Emails');
  await expect(page.locator('.communication-filters')).toContainText('Notes');
  await expect(page.locator('.communication-filters')).toContainText('Missed Follow-Ups');

  await expect(page.locator('#conversationTimeline')).toContainText('Incoming Text');
  await expect(page.locator('#conversationTimeline')).toContainText('Outgoing Text');
  await expect(page.locator('#conversationTimeline')).toContainText('Call Log');
  await expect(page.locator('#conversationTimeline')).toContainText('Voicemail');
  await expect(page.locator('#conversationTimeline')).toContainText('Email');
  await expect(page.locator('#conversationTimeline')).toContainText('Appointment');
  await expect(page.locator('#conversationTimeline')).toContainText('Task Completion');
  await expect(page.locator('#conversationTimeline')).toContainText('Automation Event');
  await expect(page.locator('#conversationTimeline')).toContainText('System Notes');
  await expect(page.locator('#conversationTimeline')).toContainText('Rep:');
  await expect(page.locator('#conversationTimeline')).toContainText('Outcome:');

  await expect(page.locator('#messageComposer')).toContainText('Customer');
  await expect(page.locator('#messageComposer')).toContainText('Text');
  await expect(page.locator('#messageComposer')).toContainText('Email');
  await expect(page.locator('#messageComposer')).toContainText('Internal Note');
  await expect(page.locator('#messageComposer')).toContainText('New lead follow-up');
  await expect(page.locator('#messageComposer')).toContainText('Appointment confirmation');
  await expect(page.locator('#messageComposer')).toContainText('Estimate follow-up');
  await expect(page.locator('#messageComposer')).toContainText('No-answer follow-up');
  await expect(page.locator('#messageComposer')).toContainText('Review request');
  await expect(page.locator('#messageComposer')).toContainText('Referral request');
  await expect(page.locator('#messageComposer')).toContainText('Win-back message');
  await expect(page.locator('#messageComposer')).toContainText('Emoji picker');
  await expect(page.locator('#messageComposer')).toContainText('Templates');
  await expect(page.locator('#messageComposer')).toContainText('Quick replies');
  await expect(page.getByRole('button', { name: 'Schedule message' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save draft' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Attachments' })).toBeVisible();

  await expect(page.locator('#callControls')).toContainText('Call Timer');
  await expect(page.locator('#callControls')).toContainText('Mute');
  await expect(page.locator('#callControls')).toContainText('Speaker');
  await expect(page.locator('#callControls')).toContainText('Hold');
  await expect(page.locator('#callControls')).toContainText('Transfer');
  await expect(page.locator('#callControls')).toContainText('Record');
  await expect(page.locator('#callControls')).toContainText('End Call');
  await expect(page.locator('#callControls')).toContainText('Connected');
  await expect(page.locator('#callControls')).toContainText('No answer');
  await expect(page.locator('#callControls')).toContainText('Left voicemail');
  await expect(page.locator('#callControls')).toContainText('Bad number');
  await expect(page.locator('#callControls')).toContainText('Booked appointment');
  await expect(page.locator('#callControls')).toContainText('Not interested');

  await expect(page.locator('#customerSidebar')).toContainText('Customer Information');
  await expect(page.locator('#customerSidebar')).toContainText('Lead Score');
  await expect(page.locator('#customerSidebar')).toContainText('Open Full Profile');
  await expect(page.locator('#aiAssistantPanel')).toContainText('Suggested Reply');
  await expect(page.locator('#aiAssistantPanel')).toContainText('Suggested Next Step');
  await expect(page.locator('#aiAssistantPanel')).toContainText('Objection Handling Tips');
  await expect(page.locator('#aiAssistantPanel')).toContainText('Recommended Questions');
  await expect(page.locator('#aiAssistantPanel')).toContainText('Sentiment Analysis');
  await expect(page.locator('#quickActionsPanel')).toContainText('Create Follow-Up Task');
  await expect(page.locator('#quickActionsPanel')).toContainText('Schedule Appointment');
  await expect(page.locator('#quickActionsPanel')).toContainText('Move Lead Stage');
  await expect(page.locator('#quickActionsPanel')).toContainText('Mark Hot');
  await expect(page.locator('#quickActionsPanel')).toContainText('Mark Warm');
  await expect(page.locator('#quickActionsPanel')).toContainText('Mark Cold');
  await expect(page.locator('#quickActionsPanel')).toContainText('Add Note');
  await expect(page.locator('#communicationNotificationFeed')).toContainText('Incoming message');
  await expect(page.locator('#communicationNotificationFeed')).toContainText('Missed call');
  await expect(page.locator('#communicationNotificationFeed')).toContainText('New voicemail');
  await expect(page.locator('#communicationNotificationFeed')).toContainText('Appointment reminder');

  await page.locator('#communicationComposerInput').fill('This is a unified inbox test text.');
  await page.getByRole('button', { name: 'Send Text' }).click();
  await expect(page.locator('#conversationTimeline')).toContainText('This is a unified inbox test text.');
  await expect(page.locator('#communicationsStatus')).toContainText('logged in demo mode');
  await expect(page.locator('#communicationToastRegion')).toContainText('Outgoing Text logged');

  await page.locator('#callControls').getByRole('button', { name: 'No answer' }).click();
  await expect(page.locator('#conversationTimeline')).toContainText('No answer call logged');
  await expect(page.locator('#conversationTimeline')).toContainText('Follow-up task created');
  await expect(page.locator('#communicationsStatus')).toContainText('No answer call logged');

  await page.locator('#quickActionsPanel').getByRole('button', { name: 'Add Note' }).click();
  await expect(page.locator('#conversationTimeline')).toContainText('Conversation note added');

  await page.locator('#communicationCallButton').click();
  await expect(page.locator('#communicationsStatus')).toContainText('Calling');
  await expect(page.locator('#communicationEndCallButton')).toBeEnabled();
  await page.locator('#communicationEndCallButton').click();
  await expect(page.locator('#conversationTimeline')).toContainText('Call completed');
});

test('opens section subpages inside CRM tabs', async ({ page }) => {
  await navigateTo(page, 'Dashboard', 'pipeline');
  await expect(page.locator('#subpageNav')).toContainText('Pipeline insights');
  await page.getByRole('button', { name: 'Pipeline insights' }).click();
  await expect(page.locator('#insightsPanel')).toBeVisible();
  await expect(page.locator('#pipeline')).toBeHidden();

  await page.getByRole('button', { name: 'Lead brief' }).click();
  await expect(page.locator('#leadBrief')).toBeVisible();
  await expect(page.locator('#pipeline')).toBeHidden();

  await navigateTo(page, 'Automations', 'automation');
  await page.getByRole('button', { name: 'Automation builder' }).click();
  await expect(page.locator('#automation .automation-builder')).toBeVisible();
  await expect(page.locator('#automationTemplateList')).toBeHidden();

  await page.getByRole('button', { name: 'Automation templates' }).click();
  await expect(page.locator('#automationTemplateList')).toBeVisible();

  await navigateTo(page, 'Admin', 'admin');
  await page.getByRole('button', { name: 'Backup center' }).click();
  await expect(page.locator('#workspaceBackup')).toBeVisible();
  await expect(page.locator('#saasAdmin')).toBeHidden();
});

test('shows actionable pipeline insights', async ({ page }) => {
  await openSubpage(page, 'Pipeline insights');
  await expect(page.locator('#insightsPanel')).toContainText('Pipeline insights');
  await expect(page.locator('#insightsPanel')).toContainText('LinkedIn');
  await expect(page.locator('#insightsPanel')).toContainText('$12,600');
  await expect(page.locator('#insightsPanel')).toContainText('Northstar Roofing');
  await expect(page.locator('#insightsPanel')).toContainText('Summit Auto Detail');

  await page.locator('#insightsPanel').getByRole('button', { name: /Summit Auto Detail/ }).click();
  await openLeadBrief(page);
  await expect(page.locator('#leadBrief')).toContainText('Eli Ramirez');
});

test('shows and exports lead source performance', async ({ page }) => {
  await openSubpage(page, 'Channel report');
  await expect(page.locator('#sourceReport')).toContainText('Channel report');
  await expect(page.locator('#sourceReport')).toContainText('LinkedIn');
  await expect(page.locator('#sourceReport')).toContainText('$12,600');
  await expect(page.locator('#sourceReport')).toContainText('$8,820 weighted');
  await expect(page.locator('#sourceReport')).toContainText('Avg score');
  await expect(page.locator('#sourceReport')).toContainText('Harbor Fitness');
  await expect(page.locator('#sourceReport')).toContainText('Website');
  await expect(page.locator('#sourceReport')).toContainText('$8,400');

  await page.locator('#sourceReport').getByRole('button', { name: /LinkedIn/ }).click();
  await openLeadBrief(page);
  await expect(page.locator('#leadBrief')).toContainText('Nia Brooks');

  await openSubpage(page, 'Channel report');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export source report' }).click();
  const download = await downloadPromise;
  const csv = await readFile(await download.path(), 'utf8');

  expect(download.suggestedFilename()).toBe('closepilot-source-report.csv');
  expect(csv).toContain('source,leads,value,weighted,averageScore,topLead');
  expect(csv).toContain('LinkedIn,1,12600,8820,88,Harbor Fitness');
  expect(csv).toContain('Website,1,8400,3360,92,Northstar Roofing');
});

test('manages automation status in bulk', async ({ page }) => {
  await navigateTo(page, 'Automations', 'automation');

  await expect(page.locator('#automationSummary')).toContainText('Active Automations');
  await expect(page.locator('#automationSummary')).toContainText('Paused');
  await expect(page.locator('#automationSummary')).toContainText('Drafts');
  await expect(page.locator('#automationSummary')).toContainText('Runs Today');
  await expect(page.locator('#automationSummary')).toContainText('Success Rate');
  await expect(page.locator('#automationSummary')).toContainText('Failed Runs');
  await expect(page.locator('#automationSummary')).toContainText('3');
  await expect(page.locator('#automationSummary')).toContainText('2');
  await expect(page.locator('#automationList')).toContainText('Win-back reminders');
  await expect(page.locator('#automationSaved')).toContainText('7h');
  await expect(page.getByRole('button', { name: '+ New Automation' })).toBeVisible();

  await page.getByRole('button', { name: 'Enable all' }).click();

  await expect(page.locator('#automationSummary')).toContainText('4');
  await expect(page.locator('#automationSummary')).toContainText('1');
  await expect(page.locator('#automationSaved')).toContainText('9h');

  await page.getByRole('button', { name: 'Reset defaults' }).click();

  await expect(page.locator('#automationSummary')).toContainText('3');
  await expect(page.locator('#automationSummary')).toContainText('2');
  await expect(page.locator('#automationSaved')).toContainText('7h');
});

test('builds visual no-code automation workflows', async ({ page }) => {
  await navigateTo(page, 'Automations', 'automation');
  await openAutomationSubpage(page, 'Automation builder');

  await expect(page.locator('#workflowBuilderPanel')).toContainText('Workflow Canvas');
  await expect(page.locator('#nodePalette')).toContainText('Trigger Nodes');
  await expect(page.locator('#nodePalette')).toContainText('New Lead');
  await expect(page.locator('#nodePalette')).toContainText('Appointment Booked');
  await expect(page.locator('#nodePalette')).toContainText('Incoming Text');
  await expect(page.locator('#nodePalette')).toContainText('Condition Nodes');
  await expect(page.locator('#nodePalette')).toContainText('If Lead Value >');
  await expect(page.locator('#nodePalette')).toContainText('If No Response');
  await expect(page.locator('#nodePalette')).toContainText('If AI Score >');
  await expect(page.locator('#nodePalette')).toContainText('Action Nodes');
  await expect(page.locator('#nodePalette')).toContainText('Send SMS');
  await expect(page.locator('#nodePalette')).toContainText('Webhook');
  await expect(page.locator('#nodePalette')).toContainText('End Workflow');
  await expect(page.locator('#workflowCanvasNodes').locator('.workflow-node')).toHaveCount(5);
  await expect(page.locator('#workflowConnections .workflow-connection-path')).toHaveCount(4);
  await expect(page.locator('#propertiesPanel')).toContainText('Properties Panel');
  await expect(page.locator('#workflowAutosaveStatus')).toContainText('Autosaved');

  await page.locator('[data-node-palette="webhook"]').click();
  await expect(page.locator('#workflowCanvasNodes')).toContainText('Webhook');
  await expect(page.locator('#workflowCanvasNodes').locator('.workflow-node')).toHaveCount(6);

  await page.getByRole('button', { name: 'Zoom In' }).click();
  await page.getByRole('button', { name: 'Pan Right' }).click();
  await expect(page.locator('#workflowAutosaveStatus')).toContainText('Autosaved');

  await openAutomationSubpage(page, 'Automation templates');
  await expect(page.locator('#workflowTemplateList')).toContainText('New Lead Follow-Up');
  await expect(page.locator('#workflowTemplateList')).toContainText('Missed Appointment Recovery');
  await expect(page.locator('#workflowTemplateList')).toContainText('Estimate Reminder');
  await expect(page.locator('#workflowTemplateList')).toContainText('Review Request');
  await expect(page.locator('#workflowTemplateList')).toContainText('Referral Campaign');
  await expect(page.locator('#workflowTemplateList')).toContainText('Reactivation Campaign');
  await expect(page.locator('#workflowTemplateList')).toContainText('Deposit Reminder');
  await expect(page.locator('#workflowTemplateList')).toContainText('Job Completion');
  await page.locator('#workflowTemplateList').getByRole('button', { name: 'Use Template' }).first().click();
  await expect(page.locator('#workflowBuilderPanel')).toBeVisible();
  await expect(page.locator('#automationBuilderMessage')).toContainText('loaded into the workflow canvas');

  await page.locator('#aiWorkflowPrompt').fill("When someone hasn't replied in 3 days, send a text, wait 2 days, then notify my sales manager.");
  await page.getByRole('button', { name: 'Generate Workflow' }).click();
  await expect(page.locator('#aiWorkflowMessage')).toContainText('AI converted the prompt');
  await expect(page.locator('#workflowCanvasNodes')).toContainText('If No Response');
  await expect(page.locator('#workflowCanvasNodes')).toContainText('Notify Manager');

  await openAutomationSubpage(page, 'Automation runs');
  await expect(page.locator('#automationAnalytics')).toContainText('Runs');
  await expect(page.locator('#automationAnalytics')).toContainText('Success %');
  await expect(page.locator('#automationAnalytics')).toContainText('Average Execution Time');
  await expect(page.locator('#automationAnalytics')).toContainText('Time Saved');
  await expect(page.locator('#automationAnalytics')).toContainText('Revenue Generated');
  await expect(page.locator('#executionLog')).toContainText('Workflow Name');
  await expect(page.locator('#executionLog')).toContainText('Customer');
  await expect(page.locator('#executionLog')).toContainText('Status');
  await expect(page.locator('#executionLog')).toContainText('Execution Time');
  await expect(page.locator('#executionLog')).toContainText('Success');
  await expect(page.locator('#executionLog')).toContainText('Failure');
  await page.locator('#executionLog').getByRole('button', { name: 'Retry' }).first().click();
  await expect(page.locator('#automationBuilderMessage')).toContainText('Workflow retry queued');
});

test('builds and runs a custom automation template', async ({ page }) => {
  await navigateTo(page, 'Automations', 'automation');
  const builder = page.locator('#automation');

  await openAutomationSubpage(page, 'Automation templates');
  await expect(builder.locator('#automationTemplateList')).toContainText('Qualified lead follow-up');
  await openAutomationSubpage(page, 'Automation builder');
  await builder.getByLabel('Template name').fill('Proposal rescue');
  await builder.getByLabel('Trigger').selectOption('stage-proposal');
  await builder.getByLabel('Step 1 task').fill('Send {{company}} a pricing recap.');
  await builder.getByLabel('Step 2 task').fill('Ask {{name}} for final blocker list.');
  await builder.getByLabel('Step 3 task').fill('Book a close-plan review with {{name}}.');

  await expect(builder.locator('#automationPreview')).toContainText('Send Northstar Roofing a pricing recap.');
  await expect(builder.locator('#automationPreview')).toContainText('Ask Maya Johnson for final blocker list.');

  await builder.getByRole('button', { name: 'Save template' }).click();

  await expect(builder.locator('#automationBuilderMessage')).toContainText('Automation template saved.');
  await openAutomationSubpage(page, 'Automation templates');
  const template = builder.locator('.automation-template-card').filter({ hasText: 'Proposal rescue' });
  await expect(template).toContainText('Moved to Proposal');
  await expect(template).toContainText('3 steps');

  await template.getByRole('button', { name: 'Run on selected lead' }).click();

  await expect(page).toHaveURL(/#tasks/);
  await expect(page.locator('#taskList')).toContainText('Send Northstar Roofing a pricing recap.');
  await page.getByRole('button', { name: /Upcoming/ }).click();
  await expect(page.locator('#taskList')).toContainText('Ask Maya Johnson for final blocker list.');
  await expect(page.locator('#taskList')).toContainText('Book a close-plan review with Maya Johnson.');
});

test('edits, pauses, and deletes automation templates', async ({ page }) => {
  await navigateTo(page, 'Automations', 'automation');
  const builder = page.locator('#automation');
  await openAutomationSubpage(page, 'Automation templates');
  const qualifiedTemplate = builder.locator('.automation-template-card').filter({ hasText: 'Qualified lead follow-up' });

  await qualifiedTemplate.getByRole('button', { name: 'Edit' }).click();
  await openAutomationSubpage(page, 'Automation builder');
  await expect(builder.getByLabel('Template name')).toHaveValue('Qualified lead follow-up');
  await builder.getByLabel('Template name').fill('Qualified lead follow-up v2');
  await builder.getByLabel('Step 3 task').fill('Send {{company}} the final implementation checklist.');
  await builder.getByRole('button', { name: 'Save template' }).click();

  await openAutomationSubpage(page, 'Automation templates');
  const updatedTemplate = builder.locator('.automation-template-card').filter({ hasText: 'Qualified lead follow-up v2' });
  await expect(updatedTemplate).toContainText('final implementation checklist');

  await updatedTemplate.getByRole('button', { name: 'Pause' }).click();
  await openAutomationSubpage(page, 'Automation builder');
  await expect(builder.locator('#automationBuilderMessage')).toContainText('Qualified lead follow-up v2 paused.');
  await openAutomationSubpage(page, 'Automation templates');
  await expect(updatedTemplate).toContainText('Paused');

  await updatedTemplate.getByRole('button', { name: 'Delete' }).click();
  await openAutomationSubpage(page, 'Automation builder');
  await expect(builder.locator('#automationBuilderMessage')).toContainText('Qualified lead follow-up v2 deleted.');
  await openAutomationSubpage(page, 'Automation templates');
  await expect(builder.locator('#automationTemplateList')).not.toContainText('Qualified lead follow-up v2');
});

test('runs saved automation templates from lead triggers', async ({ page }) => {
  await page.getByRole('button', { name: '+ Lead' }).click();
  const dialog = page.getByRole('dialog', { name: 'Add lead' });
  await dialog.getByLabel('Contact name').fill('Avery Price');
  await dialog.getByLabel('Company').fill('Bright Path Solar');
  await dialog.getByLabel('Deal value').fill('7200');
  await dialog.getByLabel('Stage').selectOption('new');
  await dialog.getByRole('button', { name: 'Create lead' }).click();

  await navigateTo(page, 'Tasks', 'tasks');
  await expect(page.locator('#taskList')).toContainText('Call Avery Price at Bright Path Solar within 15 minutes.');
  await expect(page.locator('#taskList')).toContainText('Send Bright Path Solar a quick intro and booking link.');

  await navigateTo(page, 'Automations', 'automation');
  await openAutomationSubpage(page, 'Automation runs');
  await expect(page.locator('#automationRunList')).toContainText('Speed-to-lead starter');
  await expect(page.locator('#automationRunList')).toContainText('Bright Path Solar');
});

test('runs stage and won automation templates without duplicating automatic runs', async ({ page }) => {
  const northstarCard = page.locator('article.deal-card').filter({ hasText: 'Northstar Roofing' });
  await northstarCard.getByRole('button', { name: 'Next' }).click();

  await navigateTo(page, 'Tasks', 'tasks');
  await expect(page.locator('#taskList')).toContainText('Send Northstar Roofing a proposal-stage close plan.');
  await page.getByRole('button', { name: /Upcoming/ }).click();
  await expect(page.locator('#taskList')).toContainText('Ask Maya Johnson for final objections and decision timing.');

  await navigateTo(page, 'Dashboard', 'pipeline');
  await openLeadBrief(page);
  await page.locator('#leadBrief').getByRole('button', { name: 'Mark won' }).click();
  await navigateTo(page, 'Tasks', 'tasks');
  await page.getByRole('button', { name: /Today/ }).click();
  await expect(page.locator('#taskList')).toContainText('Send onboarding checklist to Northstar Roofing');
  await page.getByRole('button', { name: /Upcoming/ }).click();
  await expect(page.locator('#taskList')).toContainText('Schedule kickoff with Maya Johnson.');

  await navigateTo(page, 'Dashboard', 'pipeline');
  await openLeadBrief(page);
  await page.locator('#leadBrief').getByRole('button', { name: 'Reopen deal' }).click();
  await page.locator('#leadBrief').getByRole('button', { name: 'Mark won' }).click();
  await navigateTo(page, 'Automations', 'automation');
  await openAutomationSubpage(page, 'Automation runs');

  const wonRuns = page.locator('#automationRunList .automation-run-row').filter({ hasText: 'Won deal onboarding' });
  await expect(wonRuns).toHaveCount(1);
});

test('scans no-response automations once per open lead', async ({ page }) => {
  await navigateTo(page, 'Automations', 'automation');

  await page.getByRole('button', { name: 'Run no-response scan' }).click();

  await openAutomationSubpage(page, 'Automation builder');
  await expect(page.locator('#automationBuilderMessage')).toContainText('No-response scan queued 6 tasks for 3 leads.');
  await openAutomationSubpage(page, 'Automation runs');
  await expect(page.locator('#automationRunList')).toContainText('No-response check-in');

  await navigateTo(page, 'Tasks', 'tasks');
  await expect(page.locator('#taskList')).toContainText('Send Northstar Roofing a no-response check-in.');
  await page.getByRole('button', { name: /Upcoming/ }).click();
  await expect(page.locator('#taskList')).toContainText('Ask Maya Johnson if this should stay open or pause.');

  await navigateTo(page, 'Automations', 'automation');
  await openAutomationSubpage(page, 'Automations');
  await page.getByRole('button', { name: 'Run no-response scan' }).click();
  await openAutomationSubpage(page, 'Automation builder');
  await expect(page.locator('#automationBuilderMessage')).toContainText('No-response scan is already up to date.');
});

test('shows pipeline stage totals and updates them when deals move', async ({ page }) => {
  const qualifiedHeading = page.locator('[data-stage="qualified"] .stage-heading');
  const proposalHeading = page.locator('[data-stage="proposal"] .stage-heading');

  await expect(page.locator('[data-stage="new"] .stage-heading')).toContainText('$3,200');
  await expect(page.locator('[data-stage="new"] .stage-heading')).toContainText('15% close odds');
  await expect(qualifiedHeading).toContainText('$8,400');
  await expect(qualifiedHeading).toContainText('40% close odds');
  await expect(proposalHeading).toContainText('$12,600');
  await expect(proposalHeading).toContainText('70% close odds');
  await expect(page.locator('[data-stage="won"] .stage-heading')).toContainText('$5,100');
  await expect(page.locator('[data-stage="won"] .stage-heading')).toContainText('100% close odds');

  await page.locator('article.deal-card').filter({ hasText: 'Northstar Roofing' }).getByRole('button', { name: 'Next' }).click();

  await expect(qualifiedHeading).toContainText('$0');
  await expect(proposalHeading).toContainText('$21,000');
});

test('shows pipeline health metrics for visible deals', async ({ page }) => {
  await expect(page.locator('#pipelineHealth')).toContainText('Open value');
  await expect(page.locator('#pipelineHealth')).toContainText('$24,200');
  await expect(page.locator('#pipelineHealth')).toContainText('Weighted open');
  await expect(page.locator('#pipelineHealth')).toContainText('$12,660');
  await expect(page.locator('#pipelineHealth')).toContainText('Won value');
  await expect(page.locator('#pipelineHealth')).toContainText('$5,100');
  await expect(page.locator('#pipelineHealth')).toContainText('Close mix');
  await expect(page.locator('#pipelineHealth')).toContainText('17%');

  await page.getByPlaceholder('Search leads, companies, notes').fill('Harbor');

  await expect(page.locator('#pipelineHealth')).toContainText('$12,600');
  await expect(page.locator('#pipelineHealth')).toContainText('$8,820');
  await expect(page.locator('#pipelineHealth')).toContainText('$0');
  await expect(page.locator('#pipelineHealth')).toContainText('0%');
});

test('shows a global activity feed and opens related leads', async ({ page }) => {
  test.slow();
  const activityFilters = page.getByRole('group', { name: 'Activity filter' });

  await navigateTo(page, 'Activity', 'activity');
  await expect(page.locator('#activityFeed')).toContainText('Northstar Roofing');
  await expect(page.locator('#activityFeed')).toContainText('Stage set to Qualified.');
  await expect(page.locator('#activitySummary')).toHaveText('2 activities shown');

  await navigateTo(page, 'Dashboard', 'pipeline');
  await openLeadBrief(page);
  await page.locator('#leadBrief').getByRole('button', { name: 'Add follow-up' }).click();
  await navigateTo(page, 'Activity', 'activity');
  await activityFilters.getByRole('button', { name: 'Tasks' }).click();
  await expect(page.locator('#activityFeed')).toContainText('Follow-up task added.');
  await expect(page.locator('#activityFeed')).not.toContainText('Stage set to Qualified.');
  await expect(page.locator('#activitySummary')).toHaveText('1 activity shown');

  await navigateTo(page, 'Dashboard', 'pipeline');
  await openLeadBrief(page);
  await page.locator('#leadBrief').getByRole('button', { name: 'Open details' }).click();
  const dialog = page.getByRole('dialog', { name: 'Northstar Roofing' });
  await dialog.getByPlaceholder('Log a call, objection, or update').fill('Customer asked for Tuesday scheduling.');
  await dialog.getByRole('button', { name: 'Add note' }).click();
  await page.getByRole('button', { name: 'Close' }).click();
  await navigateTo(page, 'Activity', 'activity');
  await activityFilters.getByRole('button', { name: 'Notes' }).click();
  await expect(page.locator('#activityFeed')).toContainText('Note: Customer asked for Tuesday scheduling.');
  await expect(page.locator('#activityFeed')).not.toContainText('Follow-up task added.');

  await activityFilters.getByRole('button', { name: 'Deals' }).click();
  await expect(page.locator('#activityFeed')).toContainText('No activity yet.');
  await expect(page.locator('#activitySummary')).toHaveText('0 activities shown');
  await expect(page.getByRole('button', { name: 'Export visible activity' })).toBeDisabled();

  await activityFilters.getByRole('button', { name: 'All' }).click();
  await page.getByPlaceholder('Search activity').fill('Tuesday');
  await expect(page.locator('#activityFeed')).toContainText('Note: Customer asked for Tuesday scheduling.');
  await expect(page.locator('#activityFeed')).not.toContainText('Stage set to Qualified.');
  await expect(page.locator('#activitySummary')).toHaveText('1 activity shown');
  await page.getByPlaceholder('Search activity').fill('Northstar');
  await expect(page.locator('#activityFeed')).toContainText('Stage set to Qualified.');
  await expect(page.locator('#activitySummary')).toHaveText('4 activities shown');

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export visible activity' }).click();
  const download = await downloadPromise;
  const csv = await readFile(await download.path(), 'utf8');

  expect(download.suggestedFilename()).toBe('closepilot-visible-activity.csv');
  expect(csv).toContain('Northstar Roofing');
  expect(csv).toContain('Follow-up task added.');
  expect(csv).not.toContain('Harbor Fitness');
  await page.getByPlaceholder('Search activity').fill('');

  await navigateTo(page, 'Dashboard', 'pipeline');
  await openDashboardOverview(page);
  await page.locator('#pipelineBoard').getByText('Harbor Fitness').click();
  await openLeadBrief(page);
  await expect(page.locator('#leadBrief')).toContainText('Nia Brooks');

  await navigateTo(page, 'Activity', 'activity');
  await page
    .locator('#activityFeed .activity-feed-item')
    .filter({ hasText: 'Northstar Roofing' })
    .first()
    .getByRole('button', { name: 'View' })
    .click();

  await openLeadBrief(page);
  await expect(page.locator('#leadBrief')).toContainText('Maya Johnson');
});

test('sets up a new workspace with starter data', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'closepilot-state',
      JSON.stringify({
        selectedLeadId: null,
        workspaceName: 'Personal workspace',
        leads: [],
        tasks: [],
        activities: [],
        automations: [
          {
            id: 'auto-1',
            key: 'next-step-tasks',
            title: 'Create next-step tasks',
            detail: 'Every lead gets a follow-up task when it changes stage.',
            enabled: true,
            savedHours: 4,
          },
        ],
      }),
    );
  });
  await page.goto('/?setup-workspace', { waitUntil: 'domcontentloaded' });

  await openSubpage(page, 'First run');
  await expect(page.getByRole('heading', { name: 'Start your sales workspace' })).toBeVisible();
  await page.getByLabel('Business name').fill('Cameron Consulting');
  await page.getByLabel('Workspace type').selectOption('Team');
  await page.getByLabel('Sales goal').selectOption('Forecast revenue');
  await page.getByRole('button', { name: 'Load starter pipeline' }).click();

  await expect(page.locator('#workspaceNameLabel')).toContainText('Cameron Consulting');
  await expect(page.locator('#workspaceModeLabel')).toContainText('Team workspace - Forecast revenue.');
  await openDashboardOverview(page);
  await expect(page.locator('#pipelineBoard').getByText('Northstar Roofing')).toBeVisible();
});

test('exports and imports a workspace backup', async ({ page }) => {
  await navigateTo(page, 'Admin', 'admin');
  await openBackupCenter(page);

  await expect(page.locator('#backupSummary')).toContainText('4');
  await expect(page.locator('#backupSummary')).toContainText('3');
  await expect(page.locator('#backupSummary')).toContainText('2');

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export backup' }).click();
  const download = await downloadPromise;
  const backup = JSON.parse(await readFile(await download.path(), 'utf8'));

  expect(download.suggestedFilename()).toMatch(/^closepilot-backup-\d{4}-\d{2}-\d{2}\.json$/);
  expect(backup.app).toBe('Kira Home');
  expect(backup.data.leads).toHaveLength(4);
  expect(backup.data.tasks).toHaveLength(3);
  await expect(page.locator('#backupMessage')).toHaveText('Backup exported.');

  await page.locator('#importWorkspaceBackupInput').setInputFiles({
    name: 'closepilot-backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(
      JSON.stringify({
        app: 'Kira Home',
        version: 1,
        workspace: {
          name: 'Cameron Backup Co',
          type: 'Team',
          goal: 'Track every lead',
        },
        data: {
          leads: [
            {
              id: 'backup-lead-1',
              name: 'Riley Stone',
              company: 'Backup Bakery',
              stage: 'proposal',
              value: 9100,
              score: 87,
              source: 'Backup file',
              nextAction: 'Send restored proposal',
              notes: 'Imported from a full workspace backup.',
            },
          ],
          tasks: [{ text: 'Call restored lead', done: false, due: 'today' }],
          automations: [
            { key: 'next-step-tasks', enabled: true },
            { key: 'lead-scoring', enabled: true },
            { key: 'win-back-reminders', enabled: true },
          ],
          activities: [
            {
              leadId: 'backup-lead-1',
              type: 'note',
              message: 'Backup note restored.',
            },
          ],
        },
      }),
    ),
  });

  await expect(page.locator('#workspaceNameLabel')).toContainText('Cameron Backup Co');
  await expect(page.locator('#workspaceModeLabel')).toContainText('Team workspace - Track every lead.');
  await expect(page.locator('#pipelineBoard')).toContainText('Backup Bakery');
  await expect(page.locator('#pipelineBoard')).not.toContainText('Northstar Roofing');
  await expect(page.locator('#taskList')).toContainText('Call restored lead');
  await expect(page.locator('#activityFeed')).toContainText('Backup note restored.');
  await expect(page.locator('#automationSummary')).toContainText('Active Automations');
  await expect(page.locator('#automationSummary')).toContainText('4');
  await expect(page.locator('#backupSummary')).toContainText('1');
  await expect(page.locator('#backupMessage')).toContainText('Imported 1 leads, 1 tasks, and 1 activities.');
});

test('creates a lead and an automated follow-up task', async ({ page }) => {
  await page.getByRole('button', { name: '+ Lead' }).click();
  const dialog = page.getByRole('dialog', { name: 'Add lead' });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel('Contact name').fill('Cameron Ellis');
  await dialog.getByLabel('Company').fill('Plus Growth Studio');
  await dialog.getByLabel('Deal value').fill('9600');
  await dialog.getByLabel('Stage').selectOption('proposal');
  await dialog.getByLabel('Source', { exact: true }).fill('Trade show');
  await dialog.getByLabel('Next action').fill('Book discovery call');
  await dialog.getByLabel('Notes').fill('Wants a SaaS-ready CRM workflow.');
  await dialog.getByRole('button', { name: 'Create lead' }).click();

  await openDashboardOverview(page);
  await expect(page.locator('#pipelineBoard').getByText('Plus Growth Studio')).toBeVisible();
  await openLeadBrief(page);
  await expect(page.locator('#leadBrief')).toContainText('Trade show');
  await expect(page.locator('#leadBrief')).toContainText('Book discovery call');
  await expect(page.locator('#leadBrief')).toContainText('Lead created from Trade show.');
  await expect(page.locator('#activityFeed')).toContainText('Plus Growth Studio');
  await expect(page.locator('#activityFeed')).toContainText('Lead created from Trade show.');
  await expect(page.locator('#pipelineValue')).toContainText('$38,900');

  await navigateTo(page, 'Tasks', 'tasks');
  await expect(page.locator('#taskList')).toContainText('Follow up with Cameron Ellis at Plus Growth Studio');
});

test('moves a lead forward and updates the lead brief', async ({ page }) => {
  const northstarCard = page.locator('article.deal-card').filter({ hasText: 'Northstar Roofing' });
  await northstarCard.getByRole('button', { name: 'Next' }).click();

  await openLeadBrief(page);
  await expect(page.locator('#leadBrief')).toContainText('Proposal');
  await expect(page.locator('#leadBrief')).toContainText('Stage changed to Proposal.');

  await navigateTo(page, 'Tasks', 'tasks');
  await expect(page.locator('#taskList')).toContainText('Follow up with Maya Johnson after moving to Proposal');
});

test('marks the selected lead won and queues onboarding', async ({ page }) => {
  await openLeadBrief(page);
  await page.locator('#leadBrief').getByRole('button', { name: 'Mark won' }).click();

  await expect(page.locator('#leadBrief')).toContainText('Won');
  await expect(page.locator('#leadBrief')).toContainText('Deal marked Won.');
  await expect(page.locator('#leadBrief')).toContainText('Send onboarding checklist and request kickoff details.');
  await expect(page.locator('#taskList')).toContainText('Send onboarding checklist to Northstar Roofing');
  await expect(page.locator('[data-stage="won"]')).toContainText('Northstar Roofing');
  await expect(page.locator('#leadBrief').getByRole('button', { name: 'Reopen deal' })).toBeVisible();
});

test('reopens a won lead from the detail workspace', async ({ page }) => {
  await page.locator('#pipelineBoard').getByText('Stone & Finch Realty').click();
  await openLeadBrief(page);
  await page.locator('#leadBrief').getByRole('button', { name: 'Open details' }).click();

  const dialog = page.getByRole('dialog', { name: 'Stone & Finch Realty' });
  await dialog.getByRole('button', { name: 'Reopen deal' }).click();

  await expect(dialog).toContainText('Proposal deal');
  await expect(dialog).toContainText('Deal reopened to Proposal.');
  await expect(dialog).toContainText('Reconfirm timeline and pricing with Caleb Stone.');
  await expect(page.locator('#taskList')).toContainText(
    'Reconfirm next steps with Caleb Stone at Stone & Finch Realty',
  );
});

test('shows a weighted pipeline forecast', async ({ page }) => {
  await page.getByRole('button', { name: 'Forecast' }).click();

  await expect(page.locator('#pipelineBoard')).toContainText('Weighted forecast');
  await expect(page.locator('#pipelineBoard')).toContainText('$17,760');
  await expect(page.locator('#pipelineBoard')).toContainText('Projected close');
  await expect(page.locator('#pipelineBoard')).toContainText('61%');
  await expect(page.locator('#pipelineBoard')).toContainText('Harbor Fitness');

  await page.locator('#pipelineBoard').getByRole('button', { name: 'Harbor Fitness' }).click();
  await openLeadBrief(page);
  await expect(page.locator('#leadBrief')).toContainText('Nia Brooks');
});

test('tracks monthly revenue target progress', async ({ page }) => {
  await openSubpage(page, 'Monthly target');
  await expect(page.locator('#revenueGoalSummary')).toContainText('Closed');
  await expect(page.locator('#revenueGoalSummary')).toContainText('$5,100');
  await expect(page.locator('#revenueGoalSummary')).toContainText('17% booked');
  await expect(page.locator('#revenueGoalSummary')).toContainText('Projected');
  await expect(page.locator('#revenueGoalSummary')).toContainText('$17,760');
  await expect(page.locator('#revenueGoalSummary')).toContainText('59% weighted');
  await expect(page.locator('#revenueGoalSummary')).toContainText('$24,900');
  await expect(page.locator('#revenueProgressBar')).toHaveAttribute('data-progress', '59%');

  await page.locator('#revenueTargetInput').fill('20000');
  await page.getByRole('button', { name: 'Set target' }).click();

  await expect(page.locator('#revenueGoalMessage')).toHaveText('Monthly target saved at $20,000.');
  await expect(page.locator('#revenueGoalSummary')).toContainText('26% booked');
  await expect(page.locator('#revenueGoalSummary')).toContainText('89% weighted');
  await expect(page.locator('#revenueGoalSummary')).toContainText('$14,900');
  await expect(page.locator('#revenueProgressBar')).toHaveAttribute('data-progress', '89%');

  await openLeadBrief(page);
  await page.locator('#leadBrief').getByRole('button', { name: 'Mark won' }).click();

  await openSubpage(page, 'Monthly target');
  await expect(page.locator('#revenueGoalSummary')).toContainText('$13,500');
  await expect(page.locator('#revenueGoalSummary')).toContainText('68% booked');
  await expect(page.locator('#revenueGoalSummary')).toContainText('$6,500');
});

test('manages SaaS workspace plan, seats, and invites', async ({ page }) => {
  await navigateTo(page, 'Admin', 'admin');
  const admin = page.locator('#saasAdmin');

  await expect(admin).toContainText('Workspace admin');
  await expect(admin.locator('#subscriptionStatus')).toContainText('Starter trial');

  await page.getByRole('button', { name: 'Plan and seats' }).click();
  await expect(admin.locator('#planSummary')).toContainText('Starter');
  await expect(admin.locator('#planSummary')).toContainText('$29/mo');
  await expect(admin.locator('#planSummary')).toContainText('1/3');
  await expect(admin.locator('#planAddonList')).toContainText('Kira Recruit $99/mo');
  await expect(admin.locator('#planAddonList')).toContainText('Residential Lead Gen $149/mo');
  await expect(admin.locator('#planAddonList')).toContainText('Recruit + Lead Gen bundle $199/mo');
  await expect(admin.locator('#planAddonList')).toContainText('Paid add-on');
  await admin.locator('[data-addon-card="recruiting"]').getByRole('button', { name: 'Add to Plan' }).click();
  await expect(admin.locator('#adminMessage')).toContainText('Kira Recruit setup requested');

  await page.getByRole('button', { name: 'Connected apps' }).click();
  await expect(admin.getByRole('link', { name: 'View Demo' }).first()).toHaveAttribute('href', '/recruiting.html');
  await expect(admin.locator('#extensionGrid')).toContainText('Paid add-on');
  await expect(admin.locator('#extensionGrid')).toContainText('Residential Lead Gen');

  await page.getByRole('button', { name: 'Product Overview' }).click();
  await expect(admin.locator('#productOverviewGuide')).toContainText('Daily Command Center');
  await expect(admin.locator('#productOverviewGuide')).toContainText('Flow Mode + AI Copilot');
  await expect(admin.locator('#productOverviewGuide')).toContainText('Kira Recruit');
  await expect(admin.locator('#productOverviewGuide')).toContainText('Residential Lead Generator');

  await page.getByRole('button', { name: 'Members and invites' }).click();
  await expect(admin.locator('#teamSummary')).toContainText('Active members');
  await expect(admin.locator('#teamSummary')).toContainText('1');
  await expect(admin.locator('#rolePermissionGrid')).toContainText('Admin');
  await expect(admin.locator('#rolePermissionGrid')).toContainText('Manager');
  await expect(admin.locator('#rolePermissionGrid')).toContainText('Member');
  await expect(admin.locator('#inviteFunction')).toContainText('Dialer');
  await expect(admin.locator('#inviteFunction')).toContainText('Setter');
  await expect(admin.locator('#inviteFunction')).toContainText('Closer');
  await expect(admin.locator('#inviteRoleHint')).toContainText('Can manage billing');
  await expect(admin.locator('#inviteEmailPreview')).toContainText('temporary password');

  await page.getByRole('button', { name: 'Production readiness' }).click();
  await expect(admin.locator('#launchChecklist')).toContainText('Overall launch readiness');
  await expect(admin.locator('#launchChecklist')).toContainText('Cloud database');
  await expect(admin.locator('#launchChecklist')).toContainText('Add SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY');
  await expect(admin.locator('#launchChecklist')).toContainText('Add STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, and plan price IDs');
  await expect(admin.locator('#launchChecklist')).toContainText('Add INVITE_FROM_EMAIL and RESEND_API_KEY');
  await expect(admin.locator('#launchChecklist')).toContainText('OPENAI_API_KEY');

  await page.getByRole('button', { name: 'Audit trail' }).click();
  await expect(admin.locator('#auditList')).toContainText('Workspace created');

  await page.getByRole('button', { name: 'Plan and seats' }).click();
  await admin.getByRole('button', { name: 'Growth $79/mo' }).click();

  await expect(admin.locator('#subscriptionStatus')).toContainText('Growth plan');
  await expect(admin.locator('#planSummary')).toContainText('Growth');
  await expect(admin.locator('#planSummary')).toContainText('1/10');
  await expect(admin.locator('#adminMessage')).toContainText('Growth plan selected');
  await expect(admin.locator('#auditList')).toContainText('Plan changed');

  await admin.getByRole('button', { name: 'Open checkout' }).click();
  await expect(admin.locator('#adminMessage')).toContainText('Live checkout is not configured');
  await expect(admin.locator('#adminMessage')).toContainText('STRIPE_SECRET_KEY');
  await admin.getByRole('button', { name: 'Billing portal' }).click();
  await expect(admin.locator('#adminMessage')).toContainText('Billing portal is not ready yet');

  await page.getByRole('button', { name: 'Members and invites' }).click();
  await admin.locator('#inviteEmail').fill('sales@example.com');
  await admin.getByLabel('Invite role').selectOption('admin');
  await admin.locator('#inviteFunction').selectOption('setter');
  await admin.getByRole('button', { name: 'Invite', exact: true }).click();

  await expect(admin.locator('#teamList')).toContainText('sales@example.com');
  await expect(admin.locator('#teamList')).toContainText('Admin');
  await expect(admin.locator('#teamList')).toContainText('Setter');
  await expect(admin.locator('#teamList')).toContainText('Resend invite');
  await expect(admin.locator('#teamSummary')).toContainText('1');

  await page.getByRole('button', { name: 'Plan and seats' }).click();
  await expect(admin.locator('#planSummary')).toContainText('2/10');
  await page.getByRole('button', { name: 'Members and invites' }).click();
  await expect(admin.locator('#adminMessage')).toContainText('Invite link generated');
  await expect(admin.locator('#adminMessage')).toContainText('RESEND_API_KEY');
  await expect(admin.locator('#adminMessage')).toContainText('INVITE_FROM_EMAIL');
  await expect(admin.locator('#adminMessage')).toContainText('/?invite=');
  await expect(admin.locator('#adminMessage')).toContainText('Temporary password');
  await expect(admin.locator('#auditList')).toContainText('Invite staged');
  await expect(admin.locator('#auditList')).toContainText('Invite link generated');

  await admin.getByRole('button', { name: 'Resend invite' }).click();
  await expect(admin.locator('#adminMessage')).toContainText('Invite link generated');
  await expect(admin.locator('#adminMessage')).toContainText('/?invite=');
  const copiedInviteLink = await page.evaluate(() => localStorage.getItem('closepilot-last-copied-text'));
  expect(copiedInviteLink).toContain('/?invite=');
  expect(copiedInviteLink).toContain('Temporary password');

  await admin.locator('#inviteEmail').fill('sales@example.com');
  await admin.getByRole('button', { name: 'Invite', exact: true }).click();
  await expect(admin.locator('#adminMessage')).toContainText('already has access or a pending invite');
});

test('starts automated onboarding after temporary password change', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('closepilot-temporary-password-required-demo', 'true'));
  await page.reload({ waitUntil: 'load' });

  await expect(page.locator('#passwordOnboardingPanel')).toBeVisible();
  await page.locator('#temporaryNewPassword').fill('NewPassword123!');
  await page.locator('#temporaryConfirmPassword').fill('Different123!');
  await page.getByRole('button', { name: 'Change password & start onboarding' }).click();
  await expect(page.locator('#passwordOnboardingMessage')).toContainText('does not match');

  await page.locator('#temporaryConfirmPassword').fill('NewPassword123!');
  await page.getByRole('button', { name: 'Change password & start onboarding' }).click();
  await expect(page.locator('#passwordOnboardingPanel')).toBeHidden();

  await navigateTo(page, 'Tasks', 'tasks');
  await expect(page.locator('#taskList')).toContainText('Complete Kira Home onboarding tour');
  await expect(page.locator('#taskList')).toContainText('Confirm calendar, communications, and notification preferences');

  await navigateTo(page, 'Activity', 'activity');
  await expect(page.locator('#activityFeed')).toContainText('started automated onboarding');
});

test('loads scale test data for 20 dialers and 10 closers', async ({ page }) => {
  await navigateTo(page, 'Admin', 'admin');
  await openBackupCenter(page);

  const backup = page.locator('#workspaceBackup');
  await backup.getByRole('button', { name: 'Load scale test data' }).click();
  await expect(backup.locator('#backupMessage')).toContainText('Loaded 100 test leads, 20 dialers, and 10 closers.');
  await expect(backup.locator('#backupSummary')).toContainText('100');
  await expect(backup.locator('#backupSummary')).toContainText('30');

  await openSubpage(page, 'Members and invites');
  const admin = page.locator('#saasAdmin');
  await expect(admin.locator('#teamSummary')).toContainText('31');
  await expect(admin.locator('#teamList')).toContainText('dialer01@kirahome.test');
  await expect(admin.locator('#teamList')).toContainText('Dialer');
  await expect(admin.locator('#teamList')).toContainText('closer10@kirahome.test');
  await expect(admin.locator('#teamList')).toContainText('Closer');

  await navigateTo(page, 'Dial', 'dial');
  await expect(page.locator('#dialSummary')).toContainText('70');
  await expect(page.locator('#dialSummary')).toContainText('Closers');
  await expect(page.locator('#appointmentCloser option')).toHaveCount(10);
  await expect(page.locator('#appointmentCloser')).toContainText('closer01@kirahome.test');
  await expect(page.locator('#appointmentCloser')).not.toContainText('dialer01@kirahome.test');
});

test('gates admin-only navigation for member access', async ({ page }) => {
  await page.evaluate(() => {
    localStorage.setItem('closepilot-demo-role', 'member');
    window.location.hash = '#admin';
  });

  await expect(page.getByRole('link', { name: 'Admin' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Settings' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'AI Sales Manager' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Automations' })).toHaveCount(0);
  await expect(page.locator('#accessDeniedPanel')).toBeVisible();
  await expect(page.locator('#accessDeniedPanel')).toContainText('You do not have access');
  await expect(page.locator('#accessDeniedPanel')).toContainText('Member access does not include Workspace admin');

  await page.getByRole('link', { name: 'Communications' }).click();
  await expect(page.locator('.topbar h1')).toHaveText('Communications');
});

test('production API fallbacks are honest when providers are missing', async ({ request }) => {
  const readiness = await request.post('/api/system/readiness', { data: { workspaceId: 'demo-workspace' } });
  expect(readiness.ok()).toBeTruthy();
  const readinessBody = await readiness.json();
  expect(readinessBody.percentage).toBeGreaterThanOrEqual(0);
  expect(readinessBody.groups).toHaveProperty('database');

  const ai = await request.post('/api/ai/lead-copilot', {
    data: {
      workspaceId: 'demo-workspace',
      lead: { name: 'Jordan Lee', company: 'Roof replacement', stage: 'proposal', value: 18000 },
    },
  });
  expect(ai.ok()).toBeTruthy();
  const aiBody = await ai.json();
  expect(aiBody.demo).toBeTruthy();
  expect(aiBody.provider).toContain('fallback');
  expect(aiBody.bestNextAction).toBeTruthy();

  const sms = await request.post('/api/communications/send-sms', {
    data: {
      workspaceId: 'demo-workspace',
      leadId: 'lead-1',
      to: '+15555550123',
      body: 'Quick follow-up from Kira Home.',
    },
  });
  expect(sms.ok()).toBeTruthy();
  const smsBody = await sms.json();
  expect(smsBody.demo).toBeTruthy();
  expect(smsBody.message).toContain('SMS provider is not configured');

  const calendarStatus = await request.post('/api/google/calendar/status', { data: { workspaceId: 'demo-workspace' } });
  expect(calendarStatus.ok()).toBeTruthy();
  const calendarStatusBody = await calendarStatus.json();
  expect(calendarStatusBody.connected).toBeFalsy();

  const calendarConnect = await request.post('/api/google/calendar/connect', { data: { workspaceId: 'demo-workspace' } });
  expect(calendarConnect.ok()).toBeTruthy();
  const calendarConnectBody = await calendarConnect.json();
  expect(calendarConnectBody.connected).toBeFalsy();

  const calendarEvent = await request.post('/api/google/calendar/create-event', {
    data: {
      workspaceId: 'demo-workspace',
      appointment: {
        leadName: 'Test appointment',
        contactName: 'Taylor',
        assignedTo: 'closer@example.com',
        startsAt: '2026-07-08T15:00:00.000Z',
      },
    },
  });
  expect(calendarEvent.ok()).toBeTruthy();
  const calendarEventBody = await calendarEvent.json();
  expect(calendarEventBody.synced).toBeFalsy();
});

test('saves an expanded workspace profile from Settings', async ({ page }) => {
  await navigateTo(page, 'Settings', 'settings');
  const admin = page.locator('#saasAdmin');
  await openSubpage(page, 'Workspace');

  await admin.getByLabel('Owner email').fill('cameron@example.com');
  await admin.getByLabel('Industry').fill('Roofing and home services');
  await admin.getByLabel('Time zone').selectOption('America/Los_Angeles');
  await admin.getByLabel('Default lead source').fill('Referral partner');
  await admin.getByRole('button', { name: 'Update workspace' }).click();

  await expect(admin.locator('#workspaceProfileSummary')).toContainText('cameron@example.com');
  await expect(admin.locator('#workspaceProfileSummary')).toContainText('Roofing and home services');
  await expect(admin.locator('#workspaceProfileSummary')).toContainText('Pacific');
  await expect(admin.locator('#workspaceProfileSummary')).toContainText('Referral partner');
  await expect(admin.locator('#auditList')).toContainText('Workspace updated');

  await page.getByRole('button', { name: '+ Lead' }).click();
  await expect(page.getByLabel('Source', { exact: true })).toHaveValue('Referral partner');
  await page.getByRole('button', { name: 'Close' }).click();
});

test('saves UI customization preferences and applies them to the workspace shell', async ({ page }) => {
  await navigateTo(page, 'Settings', 'settings');
  const admin = page.locator('#saasAdmin');

  await openSubpage(page, 'Appearance');
  await expect(admin.locator('#customizationForm')).toContainText('Workspace appearance');
  await admin.locator('[data-theme-mode-choice="dark"]').click();
  await expect(admin.locator('#customizationMessage')).toContainText('Dark mode saved');
  await admin.getByLabel('Accent color').selectOption('green');
  await admin.getByLabel('Density').selectOption('compact');
  await admin.getByLabel('Sidebar').selectOption('compact');
  await admin.getByLabel('Brand display name').fill('Kira Roofing Studio');

  await openSubpage(page, 'Workflow and AI');
  await admin.getByLabel('Default landing page').selectOption('communications');
  await admin.getByLabel('Dashboard layout').selectOption('compact');
  await admin.getByLabel('AI tone').selectOption('friendly');
  await admin.getByLabel('Default trade').selectOption('roofing');

  await openSubpage(page, 'Dashboard');
  await admin.locator('#widgetRecommendations').setChecked(false);
  await admin.getByRole('button', { name: 'Save preferences' }).click();

  await expect(admin.locator('#customizationMessage')).toContainText('Preferences saved');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('body')).toHaveAttribute('data-density', 'compact');
  await expect(page.locator('body')).toHaveAttribute('data-sidebar', 'compact');
  await expect(admin.locator('#brandPreviewCard')).toContainText('Kira Roofing Studio');

  await page.getByRole('link', { name: 'Dashboard' }).click();
  await expect(page.locator('#aiRecommendationsWidget')).toBeHidden();
});

test('edits the selected lead', async ({ page }) => {
  await openLeadBrief(page);
  await page.locator('#leadBrief').getByRole('button', { name: 'Edit lead' }).click();
  await expect(page.getByRole('dialog', { name: 'Edit lead' })).toBeVisible();
  await page.getByLabel('Company').fill('Northstar Exterior Group');
  await page.getByLabel('Deal value').fill('11400');
  await page.getByRole('button', { name: 'Save lead' }).click();

  await expect(page.locator('#leadBrief')).toContainText('Northstar Exterior Group');
  await openDashboardOverview(page);
  await expect(page.locator('#pipelineBoard').getByText('Northstar Exterior Group')).toBeVisible();
  await expect(page.locator('#pipelineValue')).toContainText('$32,300');
});

test('deletes the selected lead', async ({ page }) => {
  await openLeadBrief(page);
  await page.locator('#leadBrief').getByRole('button', { name: 'Delete lead' }).click();

  await openDashboardOverview(page);
  await expect(page.locator('#pipelineBoard').getByText('Northstar Roofing')).toHaveCount(0);
  await expect(page.locator('#pipelineValue')).toContainText('$20,900');
});

test('creates a follow-up task from the selected lead', async ({ page }) => {
  await openLeadBrief(page);
  await page.locator('#leadBrief').getByRole('button', { name: 'Add follow-up' }).click();

  await expect(page.locator('#taskList')).toContainText(
    'Send workflow proposal and ask for install calendar. (Northstar Roofing)',
  );
  await expect(page.locator('#leadBrief')).toContainText('Follow-up task added.');
});

test('shows and applies sales assistant recommendations', async ({ page }) => {
  await openLeadBrief(page);
  await expect(page.locator('#leadBrief')).toContainText('Sales assistant');
  await expect(page.locator('#leadBrief')).toContainText('Convert interest into a decision path');

  await page.locator('#leadBrief').getByRole('button', { name: 'Open details' }).click();
  const dialog = page.getByRole('dialog', { name: 'Northstar Roofing' });
  await dialog.getByRole('button', { name: 'Apply suggestion' }).click();

  await expect(page.locator('#taskList')).toContainText(
    'Send Northstar Roofing a proposal recap and ask for the decision timeline. (Northstar Roofing)',
  );
  await expect(dialog).toContainText('Sales assistant suggestion applied.');
  await expect(dialog).toContainText('Send Northstar Roofing a proposal recap and ask for the decision timeline.');
});

test('opens a full lead detail workspace', async ({ page }) => {
  await openLeadBrief(page);
  await page.locator('#leadBrief').getByRole('button', { name: 'Open details' }).click();

  const dialog = page.getByRole('dialog', { name: 'Northstar Roofing' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('Maya Johnson');
  await expect(dialog).toContainText('Forecast value');
  await expect(dialog).toContainText('$3,360');
  await expect(dialog).toContainText('Lead intelligence');
  await expect(dialog).toContainText('Why this score?');
  await expect(dialog).toContainText('Recommended action');
  await expect(dialog).toContainText(/Hot|Warm|Nurture|Cold/);
  await expect(dialog).toContainText('Owner wants a faster quote follow-up flow');
  await expect(dialog).toContainText('Stage set to Qualified.');
});

test('runs lead detail quick actions', async ({ page }) => {
  await openLeadBrief(page);
  await page.locator('#leadBrief').getByRole('button', { name: 'Open details' }).click();
  const dialog = page.getByRole('dialog', { name: 'Northstar Roofing' });

  await dialog.getByRole('button', { name: 'Add follow-up' }).click();

  await expect(page.locator('#taskList')).toContainText(
    'Send workflow proposal and ask for install calendar. (Northstar Roofing)',
  );
  await expect(dialog).toContainText('Follow-up task added.');
});

test('logs manual notes in the lead detail workspace', async ({ page }) => {
  await openLeadBrief(page);
  await page.locator('#leadBrief').getByRole('button', { name: 'Open details' }).click();
  const dialog = page.getByRole('dialog', { name: 'Northstar Roofing' });

  await dialog.getByPlaceholder('Log a call, objection, or update').fill('Customer asked for a Friday install window.');
  await dialog.getByRole('button', { name: 'Add note' }).click();

  await expect(dialog).toContainText('Note: Customer asked for a Friday install window.');
  await expect(page.locator('#leadBrief')).toContainText('Note: Customer asked for a Friday install window.');
});

test('filters tasks by today, upcoming, done, and all', async ({ page }) => {
  await navigateTo(page, 'Tasks', 'tasks');
  const taskFilters = page.getByRole('group', { name: 'Task filter' });

  await expect(page.locator('#taskList')).toContainText('Call Maya before 3 PM');
  await expect(page.locator('#taskList')).not.toContainText('Send onboarding checklist to Stone & Finch');

  await taskFilters.getByRole('button', { name: /Done/ }).click();
  await expect(page.locator('#taskList')).toContainText('Send onboarding checklist to Stone & Finch');
  await expect(page.locator('#taskList')).not.toContainText('Call Maya before 3 PM');

  await navigateTo(page, 'Dashboard', 'pipeline');
  await openLeadBrief(page);
  await page.locator('#leadBrief').getByRole('button', { name: 'Start sequence' }).click();
  await navigateTo(page, 'Tasks', 'tasks');
  await taskFilters.getByRole('button', { name: /Upcoming/ }).click();
  await expect(page.locator('#taskList')).toContainText('Send Northstar Roofing a short proposal recap.');
  await expect(page.locator('#taskList')).toContainText(
    'Ask Maya Johnson for timeline, blockers, and decision owner. (Northstar Roofing)',
  );

  await taskFilters.getByRole('button', { name: /All/ }).click();
  await expect(page.locator('#taskList')).toContainText('Call Maya before 3 PM');
  await expect(page.locator('#taskList')).toContainText('Send onboarding checklist to Stone & Finch');
});

test('clears completed tasks', async ({ page }) => {
  await navigateTo(page, 'Tasks', 'tasks');
  const taskFilters = page.getByRole('group', { name: 'Task filter' });

  await expect(page.locator('#taskSummary')).toContainText('Completed');
  await expect(page.locator('#taskSummary')).toContainText('3');
  await taskFilters.getByRole('button', { name: /Done/ }).click();
  await expect(page.locator('#taskList')).toContainText('Send onboarding checklist to Stone & Finch');

  await page.getByRole('button', { name: 'Clear done' }).click();

  await expect(page.locator('#taskList')).toContainText('No tasks in this view.');
  await expect(taskFilters.getByRole('button', { name: /Done/ })).toContainText('0');
  await expect(page.locator('#taskSummary')).toContainText('2');
  await expect(page.locator('#taskSummary')).toContainText('0');
  await expect(page.getByRole('button', { name: 'Clear done' })).toBeDisabled();
});

test('searches tasks by text', async ({ page }) => {
  await navigateTo(page, 'Tasks', 'tasks');
  const taskFilters = page.getByRole('group', { name: 'Task filter' });

  await page.getByPlaceholder('Search task text').fill('Harbor');

  await expect(page.locator('#taskList')).toContainText('Draft Harbor Fitness proposal recap');
  await expect(page.locator('#taskList')).not.toContainText('Call Maya before 3 PM');
  await expect(taskFilters.getByRole('button', { name: /Today/ })).toContainText('1');
  await expect(taskFilters.getByRole('button', { name: /All/ })).toContainText('1');
  await expect(page.locator('#taskSummary')).toContainText('1');
});

test('sorts tasks by text', async ({ page }) => {
  await navigateTo(page, 'Tasks', 'tasks');
  const taskFilters = page.getByRole('group', { name: 'Task filter' });
  const taskRows = page.locator('#taskList .task-item');

  await taskFilters.getByRole('button', { name: /All/ }).click();
  await page.getByLabel('Sort tasks').selectOption('text');

  await expect(taskRows.first()).toContainText('Call Maya before 3 PM');
  await expect(taskRows.nth(1)).toContainText('Draft Harbor Fitness proposal recap');
});

test('completes all visible tasks', async ({ page }) => {
  await navigateTo(page, 'Tasks', 'tasks');
  const taskFilters = page.getByRole('group', { name: 'Task filter' });

  await expect(page.locator('#taskList')).toContainText('Call Maya before 3 PM');
  await page.getByRole('button', { name: 'Complete visible' }).click();

  await expect(page.locator('#taskList')).toContainText('No tasks in this view.');
  await expect(taskFilters.getByRole('button', { name: /Today/ })).toContainText('0');
  await expect(taskFilters.getByRole('button', { name: /Done/ })).toContainText('3');
  await expect(page.getByRole('button', { name: 'Complete visible' })).toBeDisabled();
});

test('snoozes visible open tasks to tomorrow', async ({ page }) => {
  await navigateTo(page, 'Tasks', 'tasks');
  const taskFilters = page.getByRole('group', { name: 'Task filter' });

  await expect(page.locator('#taskList')).toContainText('Call Maya before 3 PM');
  await page.getByRole('button', { name: 'Snooze visible' }).click();

  await expect(page.locator('#taskList')).toContainText('No tasks in this view.');
  await expect(taskFilters.getByRole('button', { name: /Today/ })).toContainText('0');
  await expect(taskFilters.getByRole('button', { name: /Upcoming/ })).toContainText('2');

  await taskFilters.getByRole('button', { name: /Upcoming/ }).click();
  await expect(page.locator('#taskList')).toContainText('Call Maya before 3 PM');
  await expect(page.locator('#taskList')).toContainText('tomorrow');
});

test('creates manual tasks with custom due dates', async ({ page }) => {
  await navigateTo(page, 'Tasks', 'tasks');
  await page.getByPlaceholder('Add a follow-up or reminder').fill('Prepare quarterly pipeline review');
  await page.getByLabel('Task due date').selectOption('next week');
  await page.locator('#taskForm').getByRole('button', { name: 'Add' }).click();

  await expect(page.locator('#taskList')).not.toContainText('Prepare quarterly pipeline review');
  await page.getByRole('button', { name: /Upcoming/ }).click();
  await expect(page.locator('#taskList')).toContainText('Prepare quarterly pipeline review');
  await expect(page.locator('#taskList')).toContainText('next week');
});

test('edits task text and due date inline', async ({ page }) => {
  await navigateTo(page, 'Tasks', 'tasks');
  const taskRow = page.locator('#taskList .task-item').filter({ hasText: 'Call Maya before 3 PM' });

  await taskRow.getByRole('button', { name: 'Edit' }).click();
  await page.getByLabel('Task text').fill('Call Maya with install calendar');
  await page.getByLabel('Edit task due date').selectOption('tomorrow');
  await page.getByRole('button', { name: 'Save' }).click();

  await expect(page.locator('#taskList')).not.toContainText('Call Maya with install calendar');
  await page.getByRole('button', { name: /Upcoming/ }).click();
  await expect(page.locator('#taskList')).toContainText('Call Maya with install calendar');
  await expect(page.locator('#taskList')).toContainText('tomorrow');
});

test('duplicates tasks from the task list', async ({ page }) => {
  await navigateTo(page, 'Tasks', 'tasks');
  const taskFilters = page.getByRole('group', { name: 'Task filter' });
  const mayaTasks = page.locator('#taskList .task-item').filter({ hasText: 'Call Maya before 3 PM' });

  await expect(mayaTasks).toHaveCount(1);
  await mayaTasks.first().getByRole('button', { name: 'Duplicate' }).click();

  await expect(mayaTasks).toHaveCount(2);
  await expect(taskFilters.getByRole('button', { name: /Today/ })).toContainText('3');
});

test('selects and clears visible tasks in bulk', async ({ page }) => {
  await navigateTo(page, 'Tasks', 'tasks');
  await expect(page.locator('#taskSelectionStatus')).toHaveText('0 selected');
  await expect(page.getByRole('button', { name: 'Export selected tasks (0)' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Complete selected (0)' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Snooze selected (0)' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Apply due date (0)' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Duplicate selected (0)' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Delete selected (0)' })).toBeDisabled();

  await page.getByRole('button', { name: 'Select visible tasks' }).click();

  await expect(page.locator('#taskSelectionStatus')).toHaveText('2 selected');
  await expect(page.getByLabel('Select task Call Maya before 3 PM')).toBeChecked();
  await expect(page.getByLabel('Select task Draft Harbor Fitness proposal recap')).toBeChecked();
  await expect(page.getByRole('button', { name: 'Complete selected (2)' })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Snooze selected (2)' })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Export selected tasks (2)' })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Apply due date (2)' })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Duplicate selected (2)' })).toBeEnabled();

  await page.getByRole('button', { name: 'Clear selected tasks' }).click();

  await expect(page.locator('#taskSelectionStatus')).toHaveText('0 selected');
  await expect(page.getByLabel('Select task Call Maya before 3 PM')).not.toBeChecked();
  await expect(page.getByRole('button', { name: 'Export selected tasks (0)' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Complete selected (0)' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Apply due date (0)' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Delete selected (0)' })).toBeDisabled();
});

test('sets selected task due dates in bulk', async ({ page }) => {
  await navigateTo(page, 'Tasks', 'tasks');
  const taskFilters = page.getByRole('group', { name: 'Task filter' });

  await page.getByRole('button', { name: 'Select visible tasks' }).click();
  await page.getByLabel('Set selected due').selectOption('next week');
  await page.getByRole('button', { name: 'Apply due date (2)' }).click();

  await expect(page.locator('#taskSelectionStatus')).toHaveText('0 selected');
  await expect(page.locator('#taskList')).toContainText('No tasks in this view.');
  await expect(taskFilters.getByRole('button', { name: /Today/ })).toContainText('0');
  await expect(taskFilters.getByRole('button', { name: /Upcoming/ })).toContainText('2');

  await taskFilters.getByRole('button', { name: /Upcoming/ }).click();
  await expect(page.locator('#taskList')).toContainText('Call Maya before 3 PM');
  await expect(page.locator('#taskList')).toContainText('Draft Harbor Fitness proposal recap');
  await expect(page.locator('#taskList')).toContainText('next week');
});

test('exports visible and selected tasks to CSV', async ({ page }) => {
  await navigateTo(page, 'Tasks', 'tasks');
  let downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export visible tasks' }).click();
  let download = await downloadPromise;
  let csv = await readFile(await download.path(), 'utf8');

  expect(download.suggestedFilename()).toBe('closepilot-visible-tasks.csv');
  expect(csv).toContain('Call Maya before 3 PM');
  expect(csv).toContain('Draft Harbor Fitness proposal recap');
  expect(csv).not.toContain('Send onboarding checklist to Stone & Finch');

  await page.getByLabel('Select task Call Maya before 3 PM').check();
  downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export selected tasks (1)' }).click();
  download = await downloadPromise;
  csv = await readFile(await download.path(), 'utf8');

  expect(download.suggestedFilename()).toBe('closepilot-selected-tasks.csv');
  expect(csv).toContain('Call Maya before 3 PM');
  expect(csv).not.toContain('Draft Harbor Fitness proposal recap');
});

test('completes and snoozes selected tasks in bulk', async ({ page }) => {
  await navigateTo(page, 'Tasks', 'tasks');
  const taskFilters = page.getByRole('group', { name: 'Task filter' });

  await page.getByLabel('Select task Call Maya before 3 PM').check();
  await page.getByRole('button', { name: 'Complete selected (1)' }).click();

  await expect(page.locator('#taskSelectionStatus')).toHaveText('0 selected');
  await expect(page.locator('#taskList')).not.toContainText('Call Maya before 3 PM');
  await expect(taskFilters.getByRole('button', { name: /Today/ })).toContainText('1');
  await expect(taskFilters.getByRole('button', { name: /Done/ })).toContainText('2');

  await page.getByLabel('Select task Draft Harbor Fitness proposal recap').check();
  await page.getByRole('button', { name: 'Snooze selected (1)' }).click();

  await expect(page.locator('#taskList')).toContainText('No tasks in this view.');
  await expect(taskFilters.getByRole('button', { name: /Today/ })).toContainText('0');
  await expect(taskFilters.getByRole('button', { name: /Upcoming/ })).toContainText('1');

  await taskFilters.getByRole('button', { name: /Upcoming/ }).click();
  await expect(page.locator('#taskList')).toContainText('Draft Harbor Fitness proposal recap');
  await expect(page.locator('#taskList')).toContainText('tomorrow');
});

test('duplicates and deletes selected tasks in bulk', async ({ page }) => {
  await navigateTo(page, 'Tasks', 'tasks');
  const taskFilters = page.getByRole('group', { name: 'Task filter' });
  const mayaTasks = page.locator('#taskList .task-item').filter({ hasText: 'Call Maya before 3 PM' });
  const harborTasks = page.locator('#taskList .task-item').filter({ hasText: 'Draft Harbor Fitness proposal recap' });

  await page.getByRole('button', { name: 'Select visible tasks' }).click();
  await page.getByRole('button', { name: 'Duplicate selected (2)' }).click();

  await expect(page.locator('#taskSelectionStatus')).toHaveText('0 selected');
  await expect(mayaTasks).toHaveCount(2);
  await expect(harborTasks).toHaveCount(2);
  await expect(taskFilters.getByRole('button', { name: /Today/ })).toContainText('4');

  await page.getByRole('button', { name: 'Select visible tasks' }).click();
  await page.getByRole('button', { name: 'Delete selected (4)' }).click();

  await expect(page.locator('#taskList')).toContainText('No tasks in this view.');
  await expect(page.locator('#taskSelectionStatus')).toHaveText('0 selected');
  await expect(taskFilters.getByRole('button', { name: /Today/ })).toContainText('0');
});

test('starts an automated follow-up sequence for the selected lead', async ({ page }) => {
  await openLeadBrief(page);
  await expect(page.locator('#leadBrief')).toContainText('Suggested sequence');
  await page.locator('#leadBrief').getByRole('button', { name: 'Start sequence' }).click();

  await expect(page.locator('#leadBrief')).toContainText('3-step follow-up sequence started.');
  await navigateTo(page, 'Tasks', 'tasks');
  await expect(page.locator('#taskList')).toContainText(
    'Send workflow proposal and ask for install calendar. (Northstar Roofing)',
  );
  await page.getByRole('button', { name: /Upcoming/ }).click();
  await expect(page.locator('#taskList')).toContainText(
    'Send Northstar Roofing a short proposal recap.',
  );
  await expect(page.locator('#taskList')).toContainText(
    'Ask Maya Johnson for timeline, blockers, and decision owner. (Northstar Roofing)',
  );
});

test('imports leads from CSV', async ({ page }) => {
  await navigateTo(page, 'Contacts', 'contacts');

  const csv = [
    'name,company,stage,value,score,source,nextAction,notes',
    'Jordan Lee,Signal Labs,qualified,7200,83,CSV import,Schedule demo,Imported lead with strong fit',
  ].join('\n');

  await page.locator('#importLeadsInput').setInputFiles({
    name: 'leads.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(csv),
  });

  await expect(page.getByRole('dialog', { name: 'Import leads' })).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'Import leads' })).toContainText('Ready');
  await expect(page.getByRole('dialog', { name: 'Import leads' })).toContainText('Signal Labs');
  await page.getByRole('button', { name: 'Import 1 lead' }).click();

  await openDashboardOverview(page);
  await expect(page.locator('#pipelineBoard').getByText('Signal Labs')).toBeVisible();
  await openLeadBrief(page);
  await expect(page.locator('#leadBrief')).toContainText('Schedule demo');
  await expect(page.locator('#pipelineValue')).toContainText('$36,500');
});

test('pulls five safe generated leads for dialers', async ({ page }) => {
  await page.route('**/lead-generator-outputs/safe-leads.csv', async (route) => {
    const csv = [
      'owner_name,property_address,mailing_address,phone,email,confidence,match_confidence,match_reason,score,channels,compliance,source,county,parcel_id',
      'Riley Park,"100 Cedar St, Austin, TX, 78701","100 Cedar St, Austin, TX, 78701",(512) 555-1001,riley@example.com,91,88,match,94,phone|email|postal,DNC clear,Licensed enrichment,Travis,TX-2001',
      'Jordan Lee,"101 Cedar St, Austin, TX, 78701","101 Cedar St, Austin, TX, 78701",(512) 555-1002,jordan@example.com,90,87,match,93,phone|email|postal,DNC clear,Licensed enrichment,Travis,TX-2002',
      'Avery Kim,"102 Cedar St, Austin, TX, 78701","102 Cedar St, Austin, TX, 78701",(512) 555-1003,avery@example.com,89,86,match,92,phone|email|postal,DNC clear,Licensed enrichment,Travis,TX-2003',
      'Morgan Ellis,"103 Cedar St, Austin, TX, 78701","103 Cedar St, Austin, TX, 78701",(512) 555-1004,morgan@example.com,88,85,match,91,phone|email|postal,DNC clear,Licensed enrichment,Travis,TX-2004',
      'Quinn Reed,"104 Cedar St, Austin, TX, 78701","104 Cedar St, Austin, TX, 78701",(512) 555-1005,quinn@example.com,87,84,match,90,phone|email|postal,DNC clear,Licensed enrichment,Travis,TX-2005',
      'Taylor Fox,"105 Cedar St, Austin, TX, 78701","105 Cedar St, Austin, TX, 78701",(512) 555-1006,taylor@example.com,86,83,match,89,phone|email|postal,DNC clear,Licensed enrichment,Travis,TX-2006',
    ].join('\n');

    await route.fulfill({
      status: 200,
      contentType: 'text/csv',
      body: csv,
    });
  });

  await navigateTo(page, 'Dial', 'dial');
  await page.getByRole('button', { name: 'Pull 5 safe leads' }).click();

  await expect(page.locator('#leadGeneratorStatus')).toContainText('Finish 5 pulled leads before pulling 5 more.');
  await expect(page.getByRole('button', { name: 'Pull 5 safe leads' })).toBeDisabled();
  await expect(page.locator('#dialActiveLead')).toContainText('Riley Park');
  await expect(page.locator('#dialActiveLead')).toContainText('100 Cedar St');
  await expect(page.locator('#dialSummary')).toContainText('5');

  await navigateTo(page, 'Tasks', 'tasks');
  await expect(page.locator('#taskList')).toContainText('Call (512) 555-1001');
  await expect(page.locator('#taskList')).toContainText('Call (512) 555-1005');
});

test('logs exact dialer texts and requires attempts before another batch', async ({ page }) => {
  await page.route('**/lead-generator-outputs/safe-leads.csv', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/csv',
      body: [
        'owner_name,property_address,mailing_address,phone,email,confidence,match_confidence,match_reason,score,channels,compliance,source,county,parcel_id',
        'Riley Park,"100 Cedar St, Austin, TX, 78701","100 Cedar St, Austin, TX, 78701",(512) 555-1001,riley@example.com,91,88,match,94,phone|email|postal,DNC clear,Licensed enrichment,Travis,TX-2001',
        'Jordan Lee,"101 Cedar St, Austin, TX, 78701","101 Cedar St, Austin, TX, 78701",(512) 555-1002,jordan@example.com,90,87,match,93,phone|email|postal,DNC clear,Licensed enrichment,Travis,TX-2002',
      ].join('\n'),
    });
  });

  await navigateTo(page, 'Dial', 'dial');
  await page.getByRole('button', { name: 'Pull 5 safe leads' }).click();
  await expect(page.getByRole('button', { name: 'Pull 5 safe leads' })).toBeDisabled();

  await page.locator('#dialContactMethod').selectOption('Text');
  await page.locator('#dialTextMessage').fill('Hi Riley, this is Cameron following up about your property estimate.');
  await page.locator('#dialNotes').fill('Initial SMS sent.');
  await page.getByRole('button', { name: 'Save outcome' }).click();

  await expect(page.locator('#dialMessage')).toContainText('Outcome saved.');
  await expect(page.locator('#dialActiveLead')).toContainText('Jordan Lee');

  await navigateTo(page, 'Activity', 'activity');
  await expect(page.locator('#activityFeed')).toContainText(
    'Text logged - Hi Riley, this is Cameron following up about your property estimate.',
  );
});

test('books dialer appointments through round robin closers', async ({ page }) => {
  await page.route('**/lead-generator-outputs/safe-leads.csv', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/csv',
      body: [
        'owner_name,property_address,mailing_address,phone,email,confidence,match_confidence,match_reason,score,channels,compliance,source,county,parcel_id',
        'Riley Park,"100 Cedar St, Austin, TX, 78701","100 Cedar St, Austin, TX, 78701",(512) 555-1001,riley@example.com,91,88,match,94,phone|email|postal,DNC clear,Licensed enrichment,Travis,TX-2001',
      ].join('\n'),
    });
  });

  await navigateTo(page, 'Dial', 'dial');
  await page.getByRole('button', { name: 'Pull 5 safe leads' }).click();
  await page.locator('#dialOutcome').selectOption('Appointment set');
  await page.locator('#appointmentDate').fill('2026-07-03');
  await page.getByRole('button', { name: '10 AM' }).click();
  await page.locator('#dialNotes').fill('Owner wants a roof inspection estimate.');
  await page.getByRole('button', { name: 'Save outcome' }).click();

  await expect(page.locator('#dialMessage')).toContainText('Appointment booked and assigned round robin.');
  await expect(page.locator('#appointmentList')).toContainText('100 Cedar St');
  await expect(page.locator('#appointmentList')).toContainText('owner@kira.local');
  await expect(page.locator('#dialActiveLead')).toContainText('Qualified');
});

test('updates dialer weekly schedule from the dial tab', async ({ page }) => {
  await navigateTo(page, 'Dial', 'dial');

  await expect(page.locator('#dialSchedulePanel')).toBeHidden();
  await page.getByRole('button', { name: 'My schedule' }).click();
  await expect(page.locator('#dialSchedulePanel')).toBeVisible();
  await expect(page.locator('#dial')).toBeHidden();

  await expect(page.locator('#dialScheduleGrid .schedule-hour').first()).toHaveText('6 AM');
  await expect(page.locator('#dialScheduleGrid .schedule-day').first()).toHaveText('Sun');

  await page.locator('[data-schedule-key="Mon-9"]').click();
  await page.locator('[data-schedule-key="Fri-17"]').click();

  await expect(page.locator('#scheduleMessage')).toContainText('Schedule updated.');
  await expect(page.locator('[data-schedule-key="Mon-9"]')).toHaveClass(/active/);
  await expect(page.locator('[data-schedule-key="Fri-17"]')).toHaveClass(/active/);

  await page.getByRole('button', { name: 'Dial floor' }).click();
  await expect(page.locator('#dial')).toBeVisible();
  await expect(page.locator('#dialSchedulePanel')).toBeHidden();
});

test('shows booked appointments in calendar and my appointments views', async ({ page }) => {
  await page.route('**/lead-generator-outputs/safe-leads.csv', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/csv',
      body: [
        'owner_name,property_address,mailing_address,phone,email,confidence,match_confidence,match_reason,score,channels,compliance,source,county,parcel_id',
        'Riley Park,"100 Cedar St, Austin, TX, 78701","100 Cedar St, Austin, TX, 78701",(512) 555-1001,riley@example.com,91,88,match,94,phone|email|postal,DNC clear,Licensed enrichment,Travis,TX-2001',
      ].join('\n'),
    });
  });

  await navigateTo(page, 'Dial', 'dial');
  await page.getByRole('button', { name: 'Pull 5 safe leads' }).click();
  await page.locator('#dialOutcome').selectOption('Appointment set');
  await page.locator('#appointmentDate').fill('2026-07-03');
  await page.getByRole('button', { name: '10 AM' }).click();
  await page.getByRole('button', { name: 'Save outcome' }).click();

  await navigateTo(page, 'Calendar', 'calendar');
  await expect(page.locator('#calendarConnectTitle')).toContainText('Google Calendar');
  await expect(page.locator('#calendarConnectStatus')).toContainText(/credentials are not configured|Sign in with cloud mode|ready to connect|CRM calendar/);
  await page.locator('#connectGoogleCalendar').click();
  await expect(page.locator('#calendarConnectStatus')).toContainText(/Google Calendar is not configured|cloud workspace|needs attention/);
  await expect(page.locator('#calendarBoard')).toContainText('100 Cedar St');
  await expect(page.locator('#calendarBoard')).toContainText('owner@kira.local');
  await expect(page.locator('#calendarBoard')).toContainText(/CRM only|not connected|not configured|Cloud mode/);

  await page.getByRole('button', { name: 'My appointments' }).click();
  await expect(page.locator('#calendarBoard')).toContainText('100 Cedar St');
});

test('reviews CSV import errors before saving', async ({ page }) => {
  await navigateTo(page, 'Contacts', 'contacts');

  const csv = [
    'name,company,stage,value,score,source,nextAction,notes',
    'Taylor Kim,Atlas Ops,proposal,4300,79,CSV import,Send pricing,Valid row',
    'Missing Company,,new,1200,55,CSV import,Qualify,Invalid row',
  ].join('\n');

  await page.locator('#importLeadsInput').setInputFiles({
    name: 'mixed-leads.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(csv),
  });

  const dialog = page.getByRole('dialog', { name: 'Import leads' });
  await expect(dialog).toContainText('Atlas Ops');
  await expect(dialog).toContainText('Needs review');
  await expect(dialog).toContainText('Row 3: Name and company are required.');
  await page.getByRole('button', { name: 'Import 1 lead' }).click();

  await expect(page.locator('#pipelineBoard').getByText('Atlas Ops')).toBeVisible();
  await expect(page.locator('#pipelineBoard').getByText('Missing Company')).toHaveCount(0);
});

test('exports leads to CSV', async ({ page }) => {
  await navigateTo(page, 'Contacts', 'contacts');

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export CSV' }).click();
  const download = await downloadPromise;
  const csv = await readFile(await download.path(), 'utf8');

  expect(download.suggestedFilename()).toBe('closepilot-leads.csv');
  expect(csv).toContain('Northstar Roofing');
  expect(csv).toContain('Harbor Fitness');
});

test('filters contacts and pipeline by search', async ({ page }) => {
  await page.getByPlaceholder('Search leads, companies, notes').fill('fitness');

  await expect(page.locator('#pipelineBoard').getByText('Harbor Fitness')).toBeVisible();
  await expect(page.locator('#pipelineBoard').getByText('Northstar Roofing')).toHaveCount(0);
});

test('filters contacts and pipeline by stage', async ({ page }) => {
  await navigateTo(page, 'Contacts', 'contacts');
  const contactFilters = page.getByRole('group', { name: 'Contact filter' });

  await expect(page.locator('#contactSummary')).toContainText('Accounts shown');
  await expect(page.locator('#contactSummary')).toContainText('$29,300');
  await expect(contactFilters.getByRole('button', { name: /All/ })).toContainText('4');
  await expect(contactFilters.getByRole('button', { name: /Proposal/ })).toContainText('1');

  await contactFilters.getByRole('button', { name: 'Proposal' }).click();

  await expect(page.locator('#contactTable')).toContainText('Harbor Fitness');
  await expect(page.locator('#contactTable')).not.toContainText('Northstar Roofing');
  await expect(page.locator('#contactSummary')).toContainText('$12,600');

  await page.getByPlaceholder('Search leads, companies, notes').fill('northstar');
  await expect(page.locator('#contactTable')).toContainText('No contacts in this view.');
  await expect(page.locator('#contactSummary')).toContainText('$0');
  await expect(contactFilters.getByRole('button', { name: /All/ })).toContainText('1');
  await expect(contactFilters.getByRole('button', { name: /Proposal/ })).toContainText('0');

  await contactFilters.getByRole('button', { name: 'All' }).click();
  await expect(page.locator('#contactTable')).toContainText('Northstar Roofing');
  await expect(page.locator('#contactSummary')).toContainText('$8,400');
});

test('sorts contacts by value and company', async ({ page }) => {
  await navigateTo(page, 'Contacts', 'contacts');
  const contactRows = page.locator('#contactTable .contact-row');

  await page.getByLabel('Sort contacts').selectOption('value-desc');
  await expect(contactRows.first()).toContainText('Harbor Fitness');

  await page.getByLabel('Sort contacts').selectOption('score-desc');
  await expect(contactRows.first()).toContainText('Northstar Roofing');
  await expect(contactRows.first().locator('.intelligence-badge')).toContainText(/Hot|Warm|Nurture|Cold/);

  await page.getByLabel('Sort contacts').selectOption('company');
  await expect(contactRows.first()).toContainText('Harbor Fitness');
  await expect(contactRows.nth(1)).toContainText('Northstar Roofing');
});

test('selects and opens leads from the contact list', async ({ page }) => {
  await navigateTo(page, 'Contacts', 'contacts');
  const harborRow = page.locator('#contactTable .contact-row').filter({ hasText: 'Harbor Fitness' });
  await expect(harborRow.locator('.intelligence-badge')).toContainText(/Hot|Warm|Nurture|Cold/);

  await harborRow.getByRole('button', { name: 'View' }).click();
  await expect(page).toHaveURL(/#pipeline/);
  await openLeadBrief(page);
  await expect(page.locator('#leadBrief')).toContainText('Nia Brooks');
  await expect(page.locator('#leadBrief')).toContainText('Harbor Fitness');

  await navigateTo(page, 'Contacts', 'contacts');
  await harborRow.getByRole('button', { name: 'Details' }).click();
  await expect(page.getByRole('dialog', { name: 'Harbor Fitness' })).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'Harbor Fitness' })).toContainText('Why this score?');
  await expect(page.getByRole('dialog', { name: 'Harbor Fitness' })).toContainText('Recommended action');
  await expect(page.getByRole('dialog', { name: 'Harbor Fitness' })).toContainText('Review proposal pricing');
});

test('manages a contact profile workspace from the contacts page', async ({ page }) => {
  await navigateTo(page, 'Contacts', 'contacts');
  const profile = page.locator('#contactProfile');
  const harborRow = page.locator('#contactTable .contact-row').filter({ hasText: 'Harbor Fitness' });

  await expect(profile).toBeHidden();
  await harborRow.getByRole('button', { name: 'Profile' }).click();

  await expect(page.locator('#contacts')).toBeHidden();
  await expect(profile).toBeVisible();
  await expect(profile).toContainText('Harbor Fitness');
  await expect(profile).toContainText('Nia Brooks');
  await expect(profile).toContainText('Lead intelligence');
  await expect(profile).toContainText('Why this score?');
  await expect(profile).toContainText('Draft Harbor Fitness proposal recap');

  await profile.getByLabel('Next action').fill('Confirm rollout date and billing owner.');
  await profile.getByRole('button', { name: 'Save next action' }).click();

  await expect(profile).toContainText('Next action updated: Confirm rollout date and billing owner.');

  await profile.getByPlaceholder('Log a call, objection, or update').fill('Nia approved a Friday launch review.');
  await profile.getByRole('button', { name: 'Log note' }).click();

  await expect(profile).toContainText('Note: Nia approved a Friday launch review.');
  await profile.getByRole('button', { name: 'Back to contacts' }).click();
  await expect(page.locator('#contacts')).toBeVisible();
  await expect(profile).toBeHidden();

  await navigateTo(page, 'Dashboard', 'pipeline');
  await openLeadBrief(page);
  await expect(page.locator('#leadBrief')).toContainText('Harbor Fitness');
  await expect(page.locator('#leadBrief')).toContainText('Confirm rollout date and billing owner.');
});

test('creates follow-up tasks from the contact list', async ({ page }) => {
  await navigateTo(page, 'Contacts', 'contacts');
  const harborRow = page.locator('#contactTable .contact-row').filter({ hasText: 'Harbor Fitness' });

  await harborRow.getByRole('button', { name: 'Task' }).click();

  await expect(page.locator('#taskList')).toContainText(
    'Review proposal pricing and implementation timeline. (Harbor Fitness)',
  );
  await openLeadBrief(page);
  await expect(page.locator('#leadBrief')).toContainText('Nia Brooks');
  await expect(page.locator('#leadBrief')).toContainText('Follow-up task added.');
});

test('creates follow-up tasks for selected contacts', async ({ page }) => {
  await navigateTo(page, 'Contacts', 'contacts');
  const northstarRow = page.locator('#contactTable .contact-row').filter({ hasText: 'Northstar Roofing' });
  const harborRow = page.locator('#contactTable .contact-row').filter({ hasText: 'Harbor Fitness' });

  await expect(page.locator('#contactSelectionStatus')).toHaveText('0 selected');
  await expect(page.getByRole('button', { name: 'Task selected (0)' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Mark won selected (0)' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Next stage selected (0)' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Export selected (0)' })).toBeDisabled();
  await northstarRow.getByLabel('Select Northstar Roofing').check();
  await harborRow.getByLabel('Select Harbor Fitness').check();
  await expect(page.locator('#contactSelectionStatus')).toHaveText('2 selected');
  await expect(page.getByRole('button', { name: 'Export selected (2)' })).toBeEnabled();
  await page.getByRole('button', { name: 'Task selected (2)' }).click();

  await expect(page).toHaveURL(/#pipeline/);
  await expect(page.locator('#taskList')).toContainText(
    'Send workflow proposal and ask for install calendar. (Northstar Roofing)',
  );
  await expect(page.locator('#taskList')).toContainText(
    'Review proposal pricing and implementation timeline. (Harbor Fitness)',
  );
  await openLeadBrief(page);
  await expect(page.locator('#leadBrief')).toContainText('Nia Brooks');

  await navigateTo(page, 'Contacts', 'contacts');
  await expect(page.locator('#contactSelectionStatus')).toHaveText('0 selected');
  await expect(page.getByRole('button', { name: 'Task selected (0)' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Mark won selected (0)' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Next stage selected (0)' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Export selected (0)' })).toBeDisabled();
});

test('selects and clears visible contacts in bulk', async ({ page }) => {
  await navigateTo(page, 'Contacts', 'contacts');
  const contactFilters = page.getByRole('group', { name: 'Contact filter' });

  await contactFilters.getByRole('button', { name: /Proposal/ }).click();
  await page.getByRole('button', { name: 'Select visible contacts' }).click();

  await expect(page.locator('#contactSelectionStatus')).toHaveText('1 selected');
  await expect(page.getByRole('button', { name: 'Task selected (1)' })).toBeEnabled();
  await expect(page.locator('#contactTable .contact-row').filter({ hasText: 'Harbor Fitness' }).getByLabel('Select Harbor Fitness')).toBeChecked();

  await page.getByRole('button', { name: 'Clear contact selection' }).click();

  await expect(page.locator('#contactSelectionStatus')).toHaveText('0 selected');
  await expect(page.getByRole('button', { name: 'Task selected (0)' })).toBeDisabled();
  await expect(page.locator('#contactTable .contact-row').filter({ hasText: 'Harbor Fitness' }).getByLabel('Select Harbor Fitness')).not.toBeChecked();
});

test('exports selected contacts to CSV', async ({ page }) => {
  await navigateTo(page, 'Contacts', 'contacts');
  const northstarRow = page.locator('#contactTable .contact-row').filter({ hasText: 'Northstar Roofing' });
  const harborRow = page.locator('#contactTable .contact-row').filter({ hasText: 'Harbor Fitness' });

  await northstarRow.getByLabel('Select Northstar Roofing').check();
  await harborRow.getByLabel('Select Harbor Fitness').check();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export selected (2)' }).click();
  const download = await downloadPromise;
  const csv = await readFile(await download.path(), 'utf8');

  expect(download.suggestedFilename()).toBe('closepilot-selected-leads.csv');
  expect(csv).toContain('Northstar Roofing');
  expect(csv).toContain('Harbor Fitness');
  expect(csv).not.toContain('Summit Auto Detail');
});

test('marks selected contacts won in bulk', async ({ page }) => {
  await navigateTo(page, 'Contacts', 'contacts');
  const contactFilters = page.getByRole('group', { name: 'Contact filter' });
  const summitRow = page.locator('#contactTable .contact-row').filter({ hasText: 'Summit Auto Detail' });
  const harborRow = page.locator('#contactTable .contact-row').filter({ hasText: 'Harbor Fitness' });

  await summitRow.getByLabel('Select Summit Auto Detail').check();
  await harborRow.getByLabel('Select Harbor Fitness').check();
  await page.getByRole('button', { name: 'Mark won selected (2)' }).click();

  await expect(page).toHaveURL(/#pipeline/);
  await expect(page.locator('[data-stage="won"]')).toContainText('Summit Auto Detail');
  await expect(page.locator('[data-stage="won"]')).toContainText('Harbor Fitness');
  await expect(page.locator('#taskList')).toContainText('Send onboarding checklist to Summit Auto Detail');
  await expect(page.locator('#taskList')).toContainText('Send onboarding checklist to Harbor Fitness');
  await openLeadBrief(page);
  await expect(page.locator('#leadBrief')).toContainText('Nia Brooks');

  await navigateTo(page, 'Contacts', 'contacts');
  await expect(page.getByRole('button', { name: 'Mark won selected (0)' })).toBeDisabled();
  await expect(contactFilters.getByRole('button', { name: /Won/ })).toContainText('3');
});

test('moves selected contacts to the next stage in bulk', async ({ page }) => {
  await navigateTo(page, 'Contacts', 'contacts');
  const contactFilters = page.getByRole('group', { name: 'Contact filter' });
  const summitRow = page.locator('#contactTable .contact-row').filter({ hasText: 'Summit Auto Detail' });
  const northstarRow = page.locator('#contactTable .contact-row').filter({ hasText: 'Northstar Roofing' });

  await summitRow.getByLabel('Select Summit Auto Detail').check();
  await northstarRow.getByLabel('Select Northstar Roofing').check();
  await page.getByRole('button', { name: 'Next stage selected (2)' }).click();

  await expect(page).toHaveURL(/#pipeline/);
  await expect(page.locator('[data-stage="qualified"]')).toContainText('Summit Auto Detail');
  await expect(page.locator('[data-stage="proposal"]')).toContainText('Northstar Roofing');
  await expect(page.locator('#taskList')).toContainText('Follow up with Eli Ramirez after moving to Qualified');
  await expect(page.locator('#taskList')).toContainText('Follow up with Maya Johnson after moving to Proposal');
  await openLeadBrief(page);
  await expect(page.locator('#leadBrief')).toContainText('Maya Johnson');

  await navigateTo(page, 'Contacts', 'contacts');
  await expect(page.getByRole('button', { name: 'Next stage selected (0)' })).toBeDisabled();
  await expect(contactFilters.getByRole('button', { name: /Qualified/ })).toContainText('1');
  await expect(contactFilters.getByRole('button', { name: /Proposal/ })).toContainText('2');
});

test('marks contacts won from the contact list', async ({ page }) => {
  await navigateTo(page, 'Contacts', 'contacts');
  const harborRow = page.locator('#contactTable .contact-row').filter({ hasText: 'Harbor Fitness' });

  await harborRow.getByRole('button', { name: 'Won' }).click();

  await openLeadBrief(page);
  await expect(page.locator('#leadBrief')).toContainText('Nia Brooks');
  await expect(page.locator('#leadBrief')).toContainText('Won');
  await expect(page.locator('#leadBrief')).toContainText('Deal marked Won.');
  await expect(page.locator('#taskList')).toContainText('Send onboarding checklist to Harbor Fitness');
  await expect(page.locator('[data-stage="won"]')).toContainText('Harbor Fitness');
});

test('moves leads forward from the contact list', async ({ page }) => {
  await navigateTo(page, 'Contacts', 'contacts');
  const summitRow = page.locator('#contactTable .contact-row').filter({ hasText: 'Summit Auto Detail' });

  await summitRow.getByRole('button', { name: 'Next stage' }).click();

  await openLeadBrief(page);
  await expect(page.locator('#leadBrief')).toContainText('Eli Ramirez');
  await expect(page.locator('#leadBrief')).toContainText('Qualified');
  await expect(page.locator('#leadBrief')).toContainText('Stage changed to Qualified.');
  await expect(page.locator('#taskList')).toContainText('Follow up with Eli Ramirez after moving to Qualified');
});
