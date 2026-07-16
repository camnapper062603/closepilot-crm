# Backup And Recovery

Do not mark backup readiness as passing until Supabase backup and restore evidence is recorded.

## Required Evidence

- Supabase plan backup capability confirmed.
- Point-in-time recovery availability confirmed or explicitly unavailable.
- Latest restore-test date and owner.
- Migration rollback/repair procedure verified in a non-production project.
- Workspace export expectations documented for customers.

## Recovery Objectives

- Private beta target RTO: 4 business hours for service restoration.
- Private beta target RPO: 24 hours unless Supabase PITR is verified.

These are targets, not guarantees, until backup evidence is recorded.

## Restore Test

1. Create or select a non-production Supabase project.
2. Restore from backup or export.
3. Run `supabase-schema.sql`.
4. Run security and route tests against the restored environment where practical.
5. Verify login, workspace membership, leads, tasks, communications, and billing subscription rows.
6. Record date, owner, source backup, result, and gaps.

## Customer Notification

For data-impacting incidents, notify affected customers with impact, time window, recovery status, and next update time. Never expose another workspace's data.
