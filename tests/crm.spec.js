// @ts-check
import { readFile } from 'node:fs/promises';
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

test('shows actionable pipeline insights', async ({ page }) => {
  await expect(page.locator('#insightsPanel')).toContainText('Pipeline insights');
  await expect(page.locator('#insightsPanel')).toContainText('LinkedIn');
  await expect(page.locator('#insightsPanel')).toContainText('$12,600');
  await expect(page.locator('#insightsPanel')).toContainText('Northstar Roofing');
  await expect(page.locator('#insightsPanel')).toContainText('Summit Auto Detail');

  await page.locator('#insightsPanel').getByRole('button', { name: /Summit Auto Detail/ }).click();
  await expect(page.locator('#leadBrief')).toContainText('Eli Ramirez');
});

test('shows and exports lead source performance', async ({ page }) => {
  await expect(page.locator('#sourceReport')).toContainText('Channel report');
  await expect(page.locator('#sourceReport')).toContainText('LinkedIn');
  await expect(page.locator('#sourceReport')).toContainText('$12,600');
  await expect(page.locator('#sourceReport')).toContainText('$8,820 weighted');
  await expect(page.locator('#sourceReport')).toContainText('Avg score');
  await expect(page.locator('#sourceReport')).toContainText('Harbor Fitness');
  await expect(page.locator('#sourceReport')).toContainText('Website');
  await expect(page.locator('#sourceReport')).toContainText('$8,400');

  await page.locator('#sourceReport').getByRole('button', { name: /LinkedIn/ }).click();
  await expect(page.locator('#leadBrief')).toContainText('Nia Brooks');

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
  await expect(page.locator('#automationSummary')).toContainText('2/3');
  await expect(page.locator('#automationSummary')).toContainText('7h');
  await expect(page.locator('#automationSummary')).toContainText('1');
  await expect(page.locator('#automationList')).toContainText('Win-back reminders');
  await expect(page.locator('#automationSaved')).toContainText('7h');

  await page.getByRole('button', { name: 'Enable all' }).click();

  await expect(page.locator('#automationSummary')).toContainText('3/3');
  await expect(page.locator('#automationSummary')).toContainText('9h');
  await expect(page.locator('#automationSummary')).toContainText('0');
  await expect(page.locator('#automationSaved')).toContainText('9h');

  await page.getByRole('button', { name: 'Reset defaults' }).click();

  await expect(page.locator('#automationSummary')).toContainText('2/3');
  await expect(page.locator('#automationSummary')).toContainText('7h');
  await expect(page.locator('#automationSummary')).toContainText('1');
  await expect(page.locator('#automationSaved')).toContainText('7h');
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
  const activityFilters = page.getByRole('group', { name: 'Activity filter' });

  await expect(page.locator('#activityFeed')).toContainText('Northstar Roofing');
  await expect(page.locator('#activityFeed')).toContainText('Stage set to Qualified.');
  await expect(page.locator('#activitySummary')).toHaveText('2 activities shown');

  await page.locator('#leadBrief').getByRole('button', { name: 'Add follow-up' }).click();
  await activityFilters.getByRole('button', { name: 'Tasks' }).click();
  await expect(page.locator('#activityFeed')).toContainText('Follow-up task added.');
  await expect(page.locator('#activityFeed')).not.toContainText('Stage set to Qualified.');
  await expect(page.locator('#activitySummary')).toHaveText('1 activity shown');

  await page.locator('#leadBrief').getByRole('button', { name: 'Open details' }).click();
  const dialog = page.getByRole('dialog', { name: 'Northstar Roofing' });
  await dialog.getByPlaceholder('Log a call, objection, or update').fill('Customer asked for Tuesday scheduling.');
  await dialog.getByRole('button', { name: 'Add note' }).click();
  await page.getByRole('button', { name: 'Close' }).click();
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

  await page.locator('#pipelineBoard').getByText('Harbor Fitness').click();
  await expect(page.locator('#leadBrief')).toContainText('Nia Brooks');

  await page
    .locator('#activityFeed .activity-feed-item')
    .filter({ hasText: 'Northstar Roofing' })
    .first()
    .getByRole('button', { name: 'View' })
    .click();

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

  await expect(page.getByRole('heading', { name: 'Start your sales workspace' })).toBeVisible();
  await page.getByLabel('Business name').fill('Cameron Consulting');
  await page.getByLabel('Workspace type').selectOption('Team');
  await page.getByLabel('Sales goal').selectOption('Forecast revenue');
  await page.getByRole('button', { name: 'Load starter pipeline' }).click();

  await expect(page.locator('#workspaceNameLabel')).toContainText('Cameron Consulting');
  await expect(page.locator('#workspaceModeLabel')).toContainText('Team workspace - Forecast revenue.');
  await expect(page.locator('#pipelineBoard').getByText('Northstar Roofing')).toBeVisible();
});

test('exports and imports a workspace backup', async ({ page }) => {
  await expect(page.locator('#backupSummary')).toContainText('4');
  await expect(page.locator('#backupSummary')).toContainText('3');
  await expect(page.locator('#backupSummary')).toContainText('2');

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export backup' }).click();
  const download = await downloadPromise;
  const backup = JSON.parse(await readFile(await download.path(), 'utf8'));

  expect(download.suggestedFilename()).toMatch(/^closepilot-backup-\d{4}-\d{2}-\d{2}\.json$/);
  expect(backup.app).toBe('ClosePilot CRM');
  expect(backup.data.leads).toHaveLength(4);
  expect(backup.data.tasks).toHaveLength(3);
  await expect(page.locator('#backupMessage')).toHaveText('Backup exported.');

  await page.locator('#importWorkspaceBackupInput').setInputFiles({
    name: 'closepilot-backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(
      JSON.stringify({
        app: 'ClosePilot CRM',
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
  await expect(page.locator('#automationSummary')).toContainText('3/3');
  await expect(page.locator('#backupSummary')).toContainText('1');
  await expect(page.locator('#backupMessage')).toContainText('Imported 1 leads, 1 tasks, and 1 activities.');
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
  await expect(page.locator('#activityFeed')).toContainText('Plus Growth Studio');
  await expect(page.locator('#activityFeed')).toContainText('Lead created from Trade show.');
  await expect(page.locator('#pipelineValue')).toContainText('$38,900');
});

test('moves a lead forward and updates the lead brief', async ({ page }) => {
  const northstarCard = page.locator('article.deal-card').filter({ hasText: 'Northstar Roofing' });
  await northstarCard.getByRole('button', { name: 'Next' }).click();

  await expect(page.getByText('Follow up with Maya Johnson after moving to Proposal')).toBeVisible();
  await expect(page.locator('#leadBrief')).toContainText('Proposal');
  await expect(page.locator('#leadBrief')).toContainText('Stage changed to Proposal.');
});

test('marks the selected lead won and queues onboarding', async ({ page }) => {
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
  await expect(page.locator('#leadBrief')).toContainText('Nia Brooks');
});

test('tracks monthly revenue target progress', async ({ page }) => {
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

  await page.locator('#leadBrief').getByRole('button', { name: 'Mark won' }).click();

  await expect(page.locator('#revenueGoalSummary')).toContainText('$13,500');
  await expect(page.locator('#revenueGoalSummary')).toContainText('68% booked');
  await expect(page.locator('#revenueGoalSummary')).toContainText('$6,500');
});

test('manages SaaS workspace plan, seats, and invites', async ({ page }) => {
  const admin = page.locator('#saasAdmin');

  await expect(admin).toContainText('Workspace admin');
  await expect(admin.locator('#subscriptionStatus')).toContainText('Starter trial');
  await expect(admin.locator('#planSummary')).toContainText('Starter');
  await expect(admin.locator('#planSummary')).toContainText('$29/mo');
  await expect(admin.locator('#planSummary')).toContainText('1/3');
  await expect(admin.locator('#teamSummary')).toContainText('Active members');
  await expect(admin.locator('#teamSummary')).toContainText('1');

  await admin.getByRole('button', { name: 'Growth $79/mo' }).click();

  await expect(admin.locator('#subscriptionStatus')).toContainText('Growth plan');
  await expect(admin.locator('#planSummary')).toContainText('Growth');
  await expect(admin.locator('#planSummary')).toContainText('1/10');
  await expect(admin.locator('#adminMessage')).toContainText('Growth plan selected');

  await admin.locator('#inviteEmail').fill('sales@example.com');
  await admin.getByLabel('Invite role').selectOption('admin');
  await admin.getByRole('button', { name: 'Invite' }).click();

  await expect(admin.locator('#teamList')).toContainText('sales@example.com');
  await expect(admin.locator('#teamList')).toContainText('admin');
  await expect(admin.locator('#teamList')).toContainText('Pending');
  await expect(admin.locator('#teamSummary')).toContainText('1');
  await expect(admin.locator('#planSummary')).toContainText('2/10');
  await expect(admin.locator('#adminMessage')).toContainText('Invite staged for sales@example.com');

  await admin.locator('#adminBusinessName').fill('ClosePilot Agency');
  await admin.locator('#adminWorkspaceType').selectOption('Team');
  await admin.locator('#adminSalesGoal').selectOption('Forecast revenue');
  await admin.getByRole('button', { name: 'Update workspace' }).click();

  await expect(page.locator('#workspaceNameLabel')).toContainText('ClosePilot Agency');
  await expect(page.locator('#workspaceModeLabel')).toContainText('Team workspace - Forecast revenue.');
  await expect(admin.locator('#adminMessage')).toContainText('Workspace settings saved.');
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

test('shows and applies sales assistant recommendations', async ({ page }) => {
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
  await page.locator('#leadBrief').getByRole('button', { name: 'Open details' }).click();

  const dialog = page.getByRole('dialog', { name: 'Northstar Roofing' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('Maya Johnson');
  await expect(dialog).toContainText('Forecast value');
  await expect(dialog).toContainText('$3,360');
  await expect(dialog).toContainText('Owner wants a faster quote follow-up flow');
  await expect(dialog).toContainText('Stage set to Qualified.');
});

test('runs lead detail quick actions', async ({ page }) => {
  await page.locator('#leadBrief').getByRole('button', { name: 'Open details' }).click();
  const dialog = page.getByRole('dialog', { name: 'Northstar Roofing' });

  await dialog.getByRole('button', { name: 'Add follow-up' }).click();

  await expect(page.locator('#taskList')).toContainText(
    'Send workflow proposal and ask for install calendar. (Northstar Roofing)',
  );
  await expect(dialog).toContainText('Follow-up task added.');
});

test('logs manual notes in the lead detail workspace', async ({ page }) => {
  await page.locator('#leadBrief').getByRole('button', { name: 'Open details' }).click();
  const dialog = page.getByRole('dialog', { name: 'Northstar Roofing' });

  await dialog.getByPlaceholder('Log a call, objection, or update').fill('Customer asked for a Friday install window.');
  await dialog.getByRole('button', { name: 'Add note' }).click();

  await expect(dialog).toContainText('Note: Customer asked for a Friday install window.');
  await expect(page.locator('#leadBrief')).toContainText('Note: Customer asked for a Friday install window.');
});

test('filters tasks by today, upcoming, done, and all', async ({ page }) => {
  const taskFilters = page.getByRole('group', { name: 'Task filter' });

  await expect(page.locator('#taskList')).toContainText('Call Maya before 3 PM');
  await expect(page.locator('#taskList')).not.toContainText('Send onboarding checklist to Stone & Finch');

  await taskFilters.getByRole('button', { name: /Done/ }).click();
  await expect(page.locator('#taskList')).toContainText('Send onboarding checklist to Stone & Finch');
  await expect(page.locator('#taskList')).not.toContainText('Call Maya before 3 PM');

  await page.locator('#leadBrief').getByRole('button', { name: 'Start sequence' }).click();
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
  const taskFilters = page.getByRole('group', { name: 'Task filter' });

  await page.getByPlaceholder('Search task text').fill('Harbor');

  await expect(page.locator('#taskList')).toContainText('Draft Harbor Fitness proposal recap');
  await expect(page.locator('#taskList')).not.toContainText('Call Maya before 3 PM');
  await expect(taskFilters.getByRole('button', { name: /Today/ })).toContainText('1');
  await expect(taskFilters.getByRole('button', { name: /All/ })).toContainText('1');
  await expect(page.locator('#taskSummary')).toContainText('1');
});

test('sorts tasks by text', async ({ page }) => {
  const taskFilters = page.getByRole('group', { name: 'Task filter' });
  const taskRows = page.locator('#taskList .task-item');

  await taskFilters.getByRole('button', { name: /All/ }).click();
  await page.getByLabel('Sort tasks').selectOption('text');

  await expect(taskRows.first()).toContainText('Call Maya before 3 PM');
  await expect(taskRows.nth(1)).toContainText('Draft Harbor Fitness proposal recap');
});

test('completes all visible tasks', async ({ page }) => {
  const taskFilters = page.getByRole('group', { name: 'Task filter' });

  await expect(page.locator('#taskList')).toContainText('Call Maya before 3 PM');
  await page.getByRole('button', { name: 'Complete visible' }).click();

  await expect(page.locator('#taskList')).toContainText('No tasks in this view.');
  await expect(taskFilters.getByRole('button', { name: /Today/ })).toContainText('0');
  await expect(taskFilters.getByRole('button', { name: /Done/ })).toContainText('3');
  await expect(page.getByRole('button', { name: 'Complete visible' })).toBeDisabled();
});

test('snoozes visible open tasks to tomorrow', async ({ page }) => {
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
  await page.getByPlaceholder('Add a follow-up or reminder').fill('Prepare quarterly pipeline review');
  await page.getByLabel('Task due date').selectOption('next week');
  await page.locator('#taskForm').getByRole('button', { name: 'Add' }).click();

  await expect(page.locator('#taskList')).not.toContainText('Prepare quarterly pipeline review');
  await page.getByRole('button', { name: /Upcoming/ }).click();
  await expect(page.locator('#taskList')).toContainText('Prepare quarterly pipeline review');
  await expect(page.locator('#taskList')).toContainText('next week');
});

test('edits task text and due date inline', async ({ page }) => {
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
  const taskFilters = page.getByRole('group', { name: 'Task filter' });
  const mayaTasks = page.locator('#taskList .task-item').filter({ hasText: 'Call Maya before 3 PM' });

  await expect(mayaTasks).toHaveCount(1);
  await mayaTasks.first().getByRole('button', { name: 'Duplicate' }).click();

  await expect(mayaTasks).toHaveCount(2);
  await expect(taskFilters.getByRole('button', { name: /Today/ })).toContainText('3');
});

test('selects and clears visible tasks in bulk', async ({ page }) => {
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
  await expect(page.locator('#leadBrief')).toContainText('Suggested sequence');
  await page.locator('#leadBrief').getByRole('button', { name: 'Start sequence' }).click();

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

  await expect(page.getByRole('dialog', { name: 'Import leads' })).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'Import leads' })).toContainText('Ready');
  await expect(page.getByRole('dialog', { name: 'Import leads' })).toContainText('Signal Labs');
  await page.getByRole('button', { name: 'Import 1 lead' }).click();

  await expect(page.locator('#pipelineBoard').getByText('Signal Labs')).toBeVisible();
  await expect(page.locator('#leadBrief')).toContainText('Schedule demo');
  await expect(page.locator('#pipelineValue')).toContainText('$36,500');
});

test('reviews CSV import errors before saving', async ({ page }) => {
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
  const contactFilters = page.getByRole('group', { name: 'Contact filter' });

  await expect(page.locator('#contactSummary')).toContainText('Accounts shown');
  await expect(page.locator('#contactSummary')).toContainText('$29,300');
  await expect(contactFilters.getByRole('button', { name: /All/ })).toContainText('4');
  await expect(contactFilters.getByRole('button', { name: /Proposal/ })).toContainText('1');

  await contactFilters.getByRole('button', { name: 'Proposal' }).click();

  await expect(page.locator('#contactTable')).toContainText('Harbor Fitness');
  await expect(page.locator('#contactTable')).not.toContainText('Northstar Roofing');
  await expect(page.locator('#pipelineBoard').getByText('Harbor Fitness')).toBeVisible();
  await expect(page.locator('#pipelineBoard').getByText('Northstar Roofing')).toHaveCount(0);
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
  const contactRows = page.locator('#contactTable .contact-row');

  await page.getByLabel('Sort contacts').selectOption('value-desc');
  await expect(contactRows.first()).toContainText('Harbor Fitness');

  await page.getByLabel('Sort contacts').selectOption('score-desc');
  await expect(contactRows.first()).toContainText('Northstar Roofing');
  await expect(contactRows.first().locator('.contact-score')).toHaveText('92');

  await page.getByLabel('Sort contacts').selectOption('company');
  await expect(contactRows.first()).toContainText('Harbor Fitness');
  await expect(contactRows.nth(1)).toContainText('Northstar Roofing');
});

test('selects and opens leads from the contact list', async ({ page }) => {
  const harborRow = page.locator('#contactTable .contact-row').filter({ hasText: 'Harbor Fitness' });

  await harborRow.getByRole('button', { name: 'View' }).click();
  await expect(page.locator('#leadBrief')).toContainText('Nia Brooks');
  await expect(page.locator('#leadBrief')).toContainText('Harbor Fitness');

  await harborRow.getByRole('button', { name: 'Details' }).click();
  await expect(page.getByRole('dialog', { name: 'Harbor Fitness' })).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'Harbor Fitness' })).toContainText('Review proposal pricing');
});

test('creates follow-up tasks from the contact list', async ({ page }) => {
  const harborRow = page.locator('#contactTable .contact-row').filter({ hasText: 'Harbor Fitness' });

  await harborRow.getByRole('button', { name: 'Task' }).click();

  await expect(page.locator('#taskList')).toContainText(
    'Review proposal pricing and implementation timeline. (Harbor Fitness)',
  );
  await expect(page.locator('#leadBrief')).toContainText('Nia Brooks');
  await expect(page.locator('#leadBrief')).toContainText('Follow-up task added.');
});

test('creates follow-up tasks for selected contacts', async ({ page }) => {
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

  await expect(page.locator('#contactSelectionStatus')).toHaveText('0 selected');
  await expect(page.getByRole('button', { name: 'Task selected (0)' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Mark won selected (0)' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Next stage selected (0)' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Export selected (0)' })).toBeDisabled();
  await expect(page.locator('#taskList')).toContainText(
    'Send workflow proposal and ask for install calendar. (Northstar Roofing)',
  );
  await expect(page.locator('#taskList')).toContainText(
    'Review proposal pricing and implementation timeline. (Harbor Fitness)',
  );
  await expect(page.locator('#leadBrief')).toContainText('Nia Brooks');
});

test('selects and clears visible contacts in bulk', async ({ page }) => {
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
  const contactFilters = page.getByRole('group', { name: 'Contact filter' });
  const summitRow = page.locator('#contactTable .contact-row').filter({ hasText: 'Summit Auto Detail' });
  const harborRow = page.locator('#contactTable .contact-row').filter({ hasText: 'Harbor Fitness' });

  await summitRow.getByLabel('Select Summit Auto Detail').check();
  await harborRow.getByLabel('Select Harbor Fitness').check();
  await page.getByRole('button', { name: 'Mark won selected (2)' }).click();

  await expect(page.getByRole('button', { name: 'Mark won selected (0)' })).toBeDisabled();
  await expect(page.locator('[data-stage="won"]')).toContainText('Summit Auto Detail');
  await expect(page.locator('[data-stage="won"]')).toContainText('Harbor Fitness');
  await expect(page.locator('#taskList')).toContainText('Send onboarding checklist to Summit Auto Detail');
  await expect(page.locator('#taskList')).toContainText('Send onboarding checklist to Harbor Fitness');
  await expect(page.locator('#leadBrief')).toContainText('Nia Brooks');
  await expect(contactFilters.getByRole('button', { name: /Won/ })).toContainText('3');
});

test('moves selected contacts to the next stage in bulk', async ({ page }) => {
  const contactFilters = page.getByRole('group', { name: 'Contact filter' });
  const summitRow = page.locator('#contactTable .contact-row').filter({ hasText: 'Summit Auto Detail' });
  const northstarRow = page.locator('#contactTable .contact-row').filter({ hasText: 'Northstar Roofing' });

  await summitRow.getByLabel('Select Summit Auto Detail').check();
  await northstarRow.getByLabel('Select Northstar Roofing').check();
  await page.getByRole('button', { name: 'Next stage selected (2)' }).click();

  await expect(page.getByRole('button', { name: 'Next stage selected (0)' })).toBeDisabled();
  await expect(page.locator('[data-stage="qualified"]')).toContainText('Summit Auto Detail');
  await expect(page.locator('[data-stage="proposal"]')).toContainText('Northstar Roofing');
  await expect(page.locator('#taskList')).toContainText('Follow up with Eli Ramirez after moving to Qualified');
  await expect(page.locator('#taskList')).toContainText('Follow up with Maya Johnson after moving to Proposal');
  await expect(page.locator('#leadBrief')).toContainText('Maya Johnson');
  await expect(contactFilters.getByRole('button', { name: /Qualified/ })).toContainText('1');
  await expect(contactFilters.getByRole('button', { name: /Proposal/ })).toContainText('2');
});

test('marks contacts won from the contact list', async ({ page }) => {
  const harborRow = page.locator('#contactTable .contact-row').filter({ hasText: 'Harbor Fitness' });

  await harborRow.getByRole('button', { name: 'Won' }).click();

  await expect(page.locator('#leadBrief')).toContainText('Nia Brooks');
  await expect(page.locator('#leadBrief')).toContainText('Won');
  await expect(page.locator('#leadBrief')).toContainText('Deal marked Won.');
  await expect(page.locator('#taskList')).toContainText('Send onboarding checklist to Harbor Fitness');
  await expect(page.locator('[data-stage="won"]')).toContainText('Harbor Fitness');
});

test('moves leads forward from the contact list', async ({ page }) => {
  const summitRow = page.locator('#contactTable .contact-row').filter({ hasText: 'Summit Auto Detail' });

  await summitRow.getByRole('button', { name: 'Next stage' }).click();

  await expect(page.locator('#leadBrief')).toContainText('Eli Ramirez');
  await expect(page.locator('#leadBrief')).toContainText('Qualified');
  await expect(page.locator('#leadBrief')).toContainText('Stage changed to Qualified.');
  await expect(page.locator('#taskList')).toContainText('Follow up with Eli Ramirez after moving to Qualified');
});
