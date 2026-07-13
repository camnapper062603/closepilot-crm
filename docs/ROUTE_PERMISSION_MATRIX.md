# Route Permission Matrix

The source of truth is `docs/route-permissions.json`. Validate it with:

```bash
npm run test:route-inventory
```

## Summary

| Family | Routes | Authentication | Minimum Role |
| --- | ---: | --- | --- |
| AI | 8 | Supabase bearer | Member |
| Communications | 6 | Supabase bearer | Member |
| Billing | 3 | Supabase bearer or Stripe signature | Owner/Admin for checkout/portal |
| Invitations | 2 | Supabase bearer | Owner/Admin to send, invited signed-in user to accept |
| Google Calendar | 4 | Supabase bearer or signed OAuth state | Owner/Admin to connect, member to status/sync |
| Kira Recruit | 8 | Supabase bearer | Owner/Admin setup, Manager usage when enabled |
| Readiness | 1 | Public summary, admin details | Owner/Admin for protected diagnostics |
| Daily Command Center | 5 | Supabase bearer | Member, team metrics Manager+ |
| Launch Command Center | 7 | Supabase bearer plus internal allowlist | Founder/internal only |

Every entry declares:

- Method and route.
- Public/protected status.
- Required authentication.
- Workspace requirement.
- Minimum role.
- Resource ownership checks.
- Provider.
- Rate limit.
- Test families.

Launch Command Center access is server-enforced through Supabase Auth plus `INTERNAL_ADMIN_EMAILS` or internal Supabase metadata. Client-supplied email, role, or workspace identity is ignored for founder authorization.
