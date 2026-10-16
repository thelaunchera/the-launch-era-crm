# Customer CRM — commercial copy

This directory is the customer-only product source. The parent repository still contains an older shared Command Center and must NOT be deployed wholesale as the commercial CRM.

## Eight views and current status

| View | Status | Source |
|---|---|---|
| Pipeline | Working owner-scoped lead stages and persisted moves | Existing stages: New, Contacted, Follow-up, Won; no fabricated monetary amounts |
| Contacts | Contact updates, stage, date and historical notes | Authenticated leads |
| Leads | Live search, stage filters, additions | Authenticated leads |
| Inbox | Not connected | Never simulate SMS, email, chat or deliveries |
| Sequences | Read-only actual follow-up steps | Existing scheduled step records only |
| Booking Calendar | Not connected | Requires verified authorization between workspace and booking account |
| Sales Forecast | Lead counts only | Deal values and conversion probabilities are not recorded yet |
| Tasks & Follow-ups | Due date and real postponement | Do not claim task completion without historical task records |

## Isolation

- Customer workspace must be created by the authenticated user AND marked non-internal.
- Every lead read/write checks the active workspace ID; the UI also rejects mismatched records.
- Database Row Level Security must independently verify every record and action.
- Public artifact only includes customer HTML, JS, CSS, pinned public SDK, robots and build metadata.
- No private AI assistants, internal orders, Idea Vault, owner dashboards, campaign tools or other owner operations.
- Never store privileged service-role secrets in browser files.
- This version supports the workspace creator. Adding employee roles requires reviewed server-side authorization.

## Build and release

At repository root run:
1. node scripts/build-customer-crm.mjs
2. node scripts/qa-customer-crm.mjs
3. node scripts/qa-customer-crm-browser.mjs (with Playwright installed)

Only .customer-site is the isolated deployment artifact. It must use a separate approved customer host and Auth redirect allowlist; never deploy the parent repository as-is.

## Before selling

Validate two different buyer workspaces with isolated fixtures, independent login and password recovery, cross-tenant API denials, mobile Safari and desktop browser interaction, real channel provider integrations, booking identity links, opted-out and bounced contact restrictions, pricing and deal-value schema, task completion audit, release version/rollback.

Do not confuse synthetic QA fixtures with real customers or metrics. Do not advertise disconnected functionality as live. Do not publish merely because static or mocked browser tests pass.
