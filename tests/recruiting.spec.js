// @ts-check
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
});

async function openRecruitingPage(page, label) {
  await page.getByRole('link', { name: label, exact: true }).click();
}

test('runs the auto recruiting workflow and creates a CRM feed', async ({ page }) => {
  await page.goto('/recruiting.html', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveTitle(/Kira Recruit/);
  await expect(page.getByRole('heading', { name: 'Kira Recruit Command Center' })).toBeVisible();
  await expect(page.locator('.recruit-hero')).toContainText('Source, screen, interview, and onboard sales talent');
  await expect(page.locator('.recruit-hero')).toContainText('Belongs to ClosePilot CRM workspaces');
  await expect(page.locator('.recruit-hero')).toContainText('Fallback AI');
  await expect(page.locator('#heroModeBadge')).toHaveText('Demo');
  await expect(page.locator('.kpi-marker')).toHaveCount(5);
  await expect(page.locator('.recruit-sidebar')).toHaveCount(0);
  await expect(page.locator('#dashboard')).toContainText('Hiring Pipeline');
  await expect(page.locator('#dashboard')).toContainText('Open roles');
  await expect(page.locator('#dashboard')).toContainText('New applicants');
  await expect(page.locator('#dashboard')).toContainText('Interviews this week');
  await expect(page.locator('#dashboard')).toContainText('Hires in progress');
  for (const stage of ['New', 'Screened', 'Interview', 'Offer', 'Hired', 'Onboarding']) {
    await expect(page.locator('#pipelineBoard')).toContainText(stage);
  }
  await expect(page.locator('#aiRecruiterPanel')).toContainText('Waiting for candidates');
  await expect(page.locator('#recruitSubpageNav')).toContainText('Job details');

  await openRecruitingPage(page, 'Job details');
  await page.getByRole('button', { name: 'List job' }).click();
  await expect(page.locator('#jobMessage')).toContainText('Job listed');

  await openRecruitingPage(page, 'Dashboard');
  await expect(page.locator('#livePostings')).toHaveText('5');

  await openRecruitingPage(page, 'Job board connectors');
  await expect(page.locator('#boardList')).toContainText('Indeed');
  await expect(page.locator('#boardList')).toContainText('Live');

  await openRecruitingPage(page, 'Single candidate location');
  await page.getByRole('button', { name: 'Sync applicants' }).click();
  await openRecruitingPage(page, 'Dashboard');
  await expect(page.locator('#applicantCount')).toHaveText('4');
  await expect(page.locator('#nextBestHire')).toContainText('Alyssa Moreno');
  await expect(page.locator('#aiRecruiterPanel')).toContainText('Alyssa Moreno');
  await page.locator('#aiRecruiterPanel').getByRole('button', { name: 'Copy message' }).click();
  await expect(page.locator('#candidateMessage')).toContainText('Outreach message copied for Alyssa Moreno');
  const alyssaPipelineCard = page.locator('[data-candidate-card]').filter({ hasText: 'Alyssa Moreno' });
  await expect(alyssaPipelineCard).toContainText('Call candidate first');
  await alyssaPipelineCard.getByRole('button', { name: /Alyssa Moreno/ }).click();
  await expect(page.locator('#candidateDetailSheet')).toBeVisible();
  await expect(page.locator('#candidateDetailBody')).toContainText('Score breakdown');
  await expect(page.locator('#candidateDetailBody')).toContainText('Onboarding checklist');
  await page.getByRole('button', { name: 'Close' }).click();
  await alyssaPipelineCard.getByRole('button', { name: 'Move Stage' }).click();
  await expect(page.locator('#candidateMessage')).toContainText('Alyssa Moreno moved to Interview');
  await openRecruitingPage(page, 'Single candidate location');
  await expect(page.locator('#candidateList')).toContainText('Alyssa Moreno');
  await expect(page.locator('#candidateList')).toContainText('Priority candidate');
  await expect(page.locator('#candidateList')).toContainText('Call candidate first');

  await page.getByRole('button', { name: 'Book interviews' }).click();
  await openRecruitingPage(page, 'Dashboard');
  await expect(page.locator('#bookedCount')).toHaveText('4');
  await openRecruitingPage(page, 'Monday, Wednesday, Friday calls');
  await expect(page.locator('#interviewList')).toContainText('Alyssa Moreno');

  await openRecruitingPage(page, 'Recruiting feed');
  await page.getByRole('button', { name: 'Sync CRM feed' }).click();
  await expect(page.locator('#feedMessage')).toContainText('CRM feed synced in the demo workspace.');

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

  await expect(page.locator('#syncMode')).toHaveText('Locked paid add-on');
  await expect(page.locator('#recruitingAccessBanner')).toBeVisible();
  await expect(page.locator('#recruitingAccessBanner')).toContainText('Kira Recruit is a paid recruiting add-on.');
  await expect(page.locator('#recruitingAccessBanner').getByRole('button', { name: 'Ask admin to enable' })).toBeVisible();
  await expect(page.locator('#aiRecruiterPanel')).toContainText('Locked paid add-on');
  await expect(page.locator('#recruitingAccessBanner').getByRole('link', { name: 'View Demo' })).toHaveAttribute('href', '/recruiting?demo=1');

  await openRecruitingPage(page, 'Job details');
  await page.getByRole('button', { name: 'List job' }).click();
  await expect(page.locator('#jobMessage')).toContainText('Kira Recruit is a locked paid add-on');

  await openRecruitingPage(page, 'Recruiting feed');
  await page.getByRole('button', { name: 'Sync CRM feed' }).click();
  await expect(page.locator('#feedMessage')).toContainText('Kira Recruit is a locked paid add-on');
});

test('opens Kira Recruit tabs as direct pages', async ({ page }) => {
  const pages = [
    ['/recruiting/job', '#job', 'job', 'Job details', 'Job details'],
    ['/recruiting/boards', '#boards', 'boards', 'Job board connectors', 'Job board connectors'],
    ['/recruiting/integrations', '#integrations', 'integrations', 'Integrations', 'Integrations'],
    ['/recruiting/applicants', '#applicants', 'applicants', 'Single candidate location', 'Applicants'],
    ['/recruiting/interviews', '#interviews', 'interviews', 'Monday, Wednesday, Friday calls', 'Interview calls'],
    ['/recruiting/onboarding', '#onboarding', 'onboarding', 'W-2/W-9', 'W-2 / W-9 onboarding'],
    ['/recruiting/payroll', '#payroll', 'payroll', 'Payroll', 'Payroll'],
    ['/recruiting/crm', '#crm', 'crm', 'Recruiting feed', 'Recruiting feed'],
  ];

  for (const [path, selector, subpage, label, heading] of pages) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#recruitingPageTitle')).toHaveText(heading);
    await expect(page.locator('#recruitPageArea')).toHaveAttribute('data-active-subpage', subpage);
    await expect(page.locator(selector)).toBeVisible();
    await expect(page.getByRole('link', { name: label, exact: true })).toHaveClass(/active/);
    await expect(page.getByRole('link', { name: label, exact: true })).toHaveAttribute('aria-current', 'page');
    await expect(page).toHaveTitle(`${heading} | Kira Recruit`);
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    const visibleSubpages = await page.evaluate(() =>
      [...document.querySelectorAll('section[data-recruit-subpage]')]
        .filter((section) => !section.hidden && section.getAttribute('aria-hidden') !== 'true')
        .map((section) => section.dataset.recruitSubpage),
    );
    expect(visibleSubpages).toEqual([subpage]);
  }
});

test('keeps clicked Kira Recruit tabs in their own page area', async ({ page }) => {
  await page.goto('/recruiting', { waitUntil: 'domcontentloaded' });

  const pages = [
    ['Job details', 'job', ['job']],
    ['Job board connectors', 'boards', ['boards']],
    ['Single candidate location', 'applicants', ['applicants']],
    ['Dashboard', 'dashboard', ['dashboard']],
  ];

  for (const [label, activeSubpage, expectedVisibleSubpages] of pages) {
    await openRecruitingPage(page, label);
    await expect(page.locator('#recruitPageArea')).toHaveAttribute('data-active-subpage', activeSubpage);
    const visibleSubpages = await page.evaluate(() =>
      [...document.querySelectorAll('section[data-recruit-subpage]')]
        .filter((section) => !section.hidden && section.getAttribute('aria-hidden') !== 'true')
        .map((section) => section.dataset.recruitSubpage),
    );
    expect(visibleSubpages).toEqual(expectedVisibleSubpages);
  }
});

test('configures job board integrations and stages onboarding payroll', async ({ page }) => {
  await page.goto('/recruiting.html', { waitUntil: 'domcontentloaded' });
  await openRecruitingPage(page, 'Integrations');
  await expect(page.getByRole('heading', { name: 'Indeed and MonsterZip integrations' })).toBeVisible();
  await expect(page.locator('#syncMode')).toHaveText('Demo recruiting workspace');
  await page.locator('#integrationProvider').selectOption('indeed');
  await page.locator('#integrationAccountId').fill('indeed-account-123');
  await page.locator('#integrationEmail').fill('recruiting@kirahome.org');
  await expect(page.locator('#integrationApiToken')).toBeDisabled();
  await page.locator('#integrationWebhookUrl').fill('https://kirahome.org/api/recruiting/applicants');
  await page.locator('#integrationBudget').fill('$35/day');
  await page.locator('#integrationNotes').fill('Texas inside sales campaign');
  await page.getByRole('button', { name: 'Save connector' }).click();
  await expect(page.locator('#integrationMessage')).toContainText('Indeed connector metadata saved');
  await expect(page.locator('#integrationGrid')).toContainText('Token not configured');

  await page.getByRole('button', { name: 'Test connection' }).click();
  await expect(page.locator('#integrationMessage')).toContainText('Indeed connection test passed');
  await expect(page.locator('#integrationGrid')).toContainText('Connected');

  await page.locator('#integrationProvider').selectOption('monsterzip');
  await page.locator('#integrationAccountId').fill('monsterzip-456');
  await page.locator('#integrationEmail').fill('jobs@kirahome.org');
  await page.getByRole('button', { name: 'Save connector' }).click();
  await expect(page.locator('#integrationGrid')).toContainText('Monster / ZipRecruiter');
  await expect(page.locator('#integrationGrid')).toContainText('Token not configured');

  await openRecruitingPage(page, 'W-2/W-9');
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

  await openRecruitingPage(page, 'Payroll');
  await expect(page.getByRole('heading', { name: 'Employee and contractor payments' })).toBeVisible();
  await page.locator('#payrollCompanyId').fill('gusto-company-123');
  await expect(page.locator('#payrollApiToken')).toBeDisabled();
  await page.getByRole('button', { name: 'Save payroll provider' }).click();
  await expect(page.locator('#payrollMessage')).toContainText('Gusto payroll metadata saved');

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

test('loads authenticated live recruiting add-on state and syncs candidates to Supabase', async ({ page }) => {
  const saveBodies = [];
  const handoffBodies = [];
  await mockLiveRecruiting(page, {
    access: {
      mode: 'live',
      locked: false,
      workspaceId: 'workspace-live',
      role: 'admin',
      setupAllowed: true,
      message: 'Kira Recruit live add-on access confirmed.',
    },
    state: {
      job: { title: 'Live Dialer', location: 'Austin', pay: '$20/hr', schedule: 'Weekdays', interviewTime: '10:00' },
      postings: [],
      integrations: {},
      interviews: [],
      onboardingWorkers: [],
      payrollProvider: {},
      payrollRuns: [],
    },
    candidates: [
      {
        id: 'live-candidate-1',
        externalId: 'live-candidate-1',
        name: 'Live Candidate',
        email: 'live.candidate@example.com',
        phone: '(555) 100-2000',
        source: 'Indeed',
        role: 'Live Dialer',
        score: 91,
        status: 'Qualified',
        skills: ['Phone confidence'],
        experience: 'Imported from live workspace.',
        syncedAt: '2026-07-09T12:00:00.000Z',
      },
    ],
    onSave: (body) => saveBodies.push(body),
    onHandoff: (body) => handoffBodies.push(body),
  });

  await page.goto('/recruiting.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#syncMode')).toHaveText('Live recruiting add-on');
  await expect(page.locator('body')).toHaveAttribute('data-addon-access', 'live');
  await openRecruitingPage(page, 'Single candidate location');
  await expect(page.locator('#candidateList')).toContainText('Live Candidate');
  const candidateCard = page.locator('.candidate-card').filter({ hasText: 'Live Candidate' });
  await candidateCard.locator('[data-candidate-field="assignedRecruiter"]').fill('Riley Recruiter');
  await candidateCard.locator('[data-candidate-field="assignedManager"]').fill('Morgan Manager');
  await candidateCard.locator('[data-candidate-field="hiringOutcome"]').selectOption('interviewing');
  await candidateCard.locator('[data-candidate-field="recruiterNotes"]').fill('Strong phone screen. Move fast.');
  await candidateCard.getByRole('button', { name: 'Save handoff' }).click();
  await expect(page.locator('#candidateMessage')).toContainText('assignment and hiring outcome saved');
  await candidateCard.getByRole('button', { name: 'Create task' }).click();
  await expect(page.locator('#candidateMessage')).toContainText('Follow-up task created');
  await candidateCard.getByRole('button', { name: 'Add note' }).click();
  await expect(page.locator('#candidateMessage')).toContainText('Activity note added');
  await candidateCard.getByRole('button', { name: 'Convert team' }).click();
  await expect(page.locator('#candidateMessage')).toContainText('team member invitation');

  await openRecruitingPage(page, 'Recruiting feed');
  await page.getByRole('button', { name: 'Sync CRM feed' }).click();
  await expect(page.locator('#feedMessage')).toContainText('CRM feed synced to live recruiting_candidates.');
  expect(saveBodies.at(-1)).toMatchObject({ workspaceId: 'workspace-live' });
  expect(saveBodies.at(-1).candidates[0]).toMatchObject({ name: 'Live Candidate', externalId: 'live-candidate-1' });
  expect(handoffBodies.map((body) => body.action)).toEqual([
    'save-handoff',
    'create-follow-up-task',
    'add-activity-note',
    'convert-team-member',
  ]);
  expect(handoffBodies[0]).toMatchObject({
    assignedRecruiter: 'Riley Recruiter',
    assignedManager: 'Morgan Manager',
    hiringOutcome: 'interviewing',
  });
});

test('lets authenticated admins enable the Kira Recruit add-on from locked state', async ({ page }) => {
  const addonBodies = [];
  await mockLiveRecruiting(page, {
    access: {
      mode: 'locked',
      locked: true,
      workspaceId: 'workspace-live',
      role: 'admin',
      setupAllowed: true,
      message: 'Kira Recruit is locked until an Owner/Admin enables early access for this CRM workspace.',
    },
    state: { job: { title: 'Enabled Dialer' }, postings: [], integrations: {}, interviews: [] },
    onAddonSettings: (body) => addonBodies.push(body),
  });

  await page.goto('/recruiting.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#recruitingAccessBanner')).toBeVisible();
  await page.getByRole('button', { name: 'Add Kira Recruit' }).click();
  await expect(page.locator('#syncMode')).toHaveText('Live recruiting add-on');
  await expect(page.locator('#recruitingAccessBanner')).toBeHidden();
  expect(addonBodies.at(-1)).toMatchObject({
    status: 'early_access',
    allowedRoles: ['owner', 'admin', 'manager'],
  });
});

test('shows authenticated locked add-on state for members without access', async ({ page }) => {
  await mockLiveRecruiting(page, {
    access: {
      mode: 'locked',
      locked: true,
      workspaceId: 'workspace-live',
      role: 'member',
      setupAllowed: false,
      message: 'Kira Recruit is a paid add-on. Ask an Owner/Admin to enable early access.',
    },
  });

  await page.goto('/recruiting.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#syncMode')).toHaveText('Locked paid add-on');
  await expect(page.locator('#recruitingAccessBanner')).toBeVisible();
  await expect(page.locator('#recruitingAccessMessage')).toContainText('paid add-on');
  await expect(page.getByRole('button', { name: 'Ask admin to enable' })).toBeVisible();

  await openRecruitingPage(page, 'Job details');
  await page.getByRole('button', { name: 'List job' }).click();
  await expect(page.locator('#jobMessage')).toContainText('Kira Recruit is a locked paid add-on');
});

async function mockLiveRecruiting(page, options = {}) {
  let access = options.access || {};
  await page.route('**/config.js', async (route) => {
    await route.fulfill({
      contentType: 'application/javascript',
      body: `
        window.ClosePilotConfig = {
          appMode: 'production',
          supabaseUrl: 'https://supabase.test',
          supabaseAnonKey: 'anon-test',
          publicDemoEnabled: false
        };
        window.KiraHomeConfig = window.ClosePilotConfig;
      `,
    });
  });
  await page.route('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm', async (route) => {
    await route.fulfill({
      contentType: 'application/javascript',
      body: `
        export function createClient() {
          return {
            auth: {
              async getSession() {
                return { data: { session: { access_token: 'test-token', user: { email: 'admin@example.com' } } } };
              }
            }
          };
        }
      `,
    });
  });
  await page.route('**/api/recruiting/**', async (route) => {
    const url = new URL(route.request().url());
    const body = route.request().postDataJSON();
    if (url.pathname === '/api/recruiting/access') {
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify(access) });
      return;
    }
    if (url.pathname === '/api/recruiting/load') {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          access,
          state: options.state || {},
          candidates: options.candidates || [],
        }),
      });
      return;
    }
    if (url.pathname === '/api/recruiting/save') {
      options.onSave?.(body);
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ saved: true, access, candidates: body.candidates || [] }),
      });
      return;
    }
    if (url.pathname === '/api/recruiting/addon-settings') {
      options.onAddonSettings?.(body);
      access = {
        ...access,
        mode: 'live',
        locked: false,
        addonStatus: body.status || 'early_access',
        label: 'Live recruiting add-on',
        message: 'Kira Recruit live add-on access confirmed.',
      };
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          saved: true,
          access,
          message: 'Kira Recruit early access is enabled for this CRM workspace.',
        }),
      });
      return;
    }
    if (url.pathname === '/api/recruiting/crm-handoff') {
      options.onHandoff?.(body);
      const candidate = {
        ...(body.candidate || {}),
        assignedRecruiter: body.assignedRecruiter || body.candidate?.assignedRecruiter || '',
        assignedManager: body.assignedManager || body.candidate?.assignedManager || '',
        hiringOutcome: body.action === 'convert-team-member' ? 'hired' : body.hiringOutcome || body.candidate?.hiringOutcome || 'screening',
        recruiterNotes: body.recruiterNotes || body.candidate?.recruiterNotes || '',
        followUpTaskId: body.action === 'create-follow-up-task' ? 'task-live-1' : body.candidate?.followUpTaskId || '',
        activityNoteId: body.action === 'add-activity-note' ? 'activity-live-1' : body.candidate?.activityNoteId || '',
        convertedMemberInvitationId: body.action === 'convert-team-member' ? 'invite-live-1' : body.candidate?.convertedMemberInvitationId || '',
        lastHandoffAt: '2026-07-09T18:00:00.000Z',
      };
      const messages = {
        'save-handoff': `${candidate.name} assignment and hiring outcome saved.`,
        'create-follow-up-task': `Follow-up task created for ${candidate.name}.`,
        'add-activity-note': `Activity note added for ${candidate.name}.`,
        'convert-team-member': `${candidate.name} was staged as a CRM team member invitation.`,
      };
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          saved: true,
          action: body.action,
          candidate,
          handoff: { action: body.action, performedAt: '2026-07-09T18:00:00.000Z' },
          message: messages[body.action] || 'Candidate handoff saved to the CRM workspace.',
        }),
      });
      return;
    }
    if (url.pathname === '/api/recruiting/integration-status') {
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ saved: true }) });
      return;
    }
    if (url.pathname === '/api/recruiting/onboarding-email') {
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ staged: true }) });
      return;
    }
    await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: 'not found' }) });
  });
}
