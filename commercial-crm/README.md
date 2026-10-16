# Business CRM — Commercial Buyer-Only Copy (TESTING)

The entire commercial CRM source is in `commercial-crm/` and is **independent** of the existing legacy root `index.html`. The legacy root may contain owner/buyer logic and is **NOT** the artifact to sell or publish.

This independent copy is currently a **testing preview, not a live purchasable product**.

## Implemented

- Eight UI views: Pipeline, Contact Profile, Lead List, Inbox, Email Sequence Draft Builder, Booking Calendar, Sales Forecast, Tasks & Follow-ups.
- Warm Ivory, Butter Yellow accents, Soft Black, Soft Blue, consistent single sidebar, and responsive layouts at phone/tablet/desktop sizes.
- Browser authentication to the isolated **Supabase Testing** project; a signed-in testing user can provision only their own empty staging workspace.
- Real database persistence for leads/contacts, contacts notes, deal stages/amounts, tasks, requested/confirmed bookings, quotas and draft sequence steps.
- Schema includes eight new `customer_crm_*` tables, real owner-based RLS for each, workspace-matching FK constraints, and database exclusion of overlapping confirmed bookings.
- Drag deal cards across stages using pointer events; keyboard ArrowLeft/ArrowRight changes deal stage. Saves use authenticated, workspace-scoped database operations.
- Forecast uses actual entered deals, with scenario adjustments that do not modify saved data.
- Empty states show truthfully when there are no records.

## Explicitly not yet live

- SMS, live email, chat and unified conversation sending are **unconnected**. Inbox is a truthful connection-needed state.
- Email sequences are **draft-only** (the DB only accepts `status='draft'`). No outbound send, scheduled background jobs, artificial reply metrics or duplicate mail.
- Public booking-page link and external calendar sync not configured. Creating and confirming appointments is workspace-internal only.
- No payments, customer subscription activation, team invites, user roles beyond owner, artificial lead scores, AI agents, or private Command Center operations.
- In-column sort persistence / full FLIP animations are not implemented. Cross-column stage transitions use saved data.
- Test login, browser QA and real cross-account RLS penetration tests are still needed before any release.
- Do not switch from testing Supabase to the owner's production Supabase project or promote testing records.
- Selling this app requires commercial provisioning, permission matrix, provider verification, QA and deployment of the isolated buyer-only build.

## Safe QA and future release artifact

Run `node scripts/qa-commercial-crm-static.mjs` to check source boundaries and JavaScript parsing.

Run `node scripts/build-commercial-crm-preview.mjs` to produce a non-deploying static preview folder `.commercial-crm-preview` containing ONLY the four commercial frontend files plus pinned Supabase browser vendor. This is an explicit allowlist; the old legacy root and all private modules stay out.

To inspect schema, see `commercial-crm/sql/20261016_customer_crm_staging.sql`. The migration was applied **only to the testing project** (afyiltvdfqnuyzcqsnoh) during development.

## Required launch verification

1. Sign in with two different synthetic test users and create distinct testing workspaces; confirm user A cannot select, update, delete or link user B records, and neither can query private TLE tables.
2. Attempt confirmed overlapping bookings and verify the database rejects the conflicting update; verify non-conflicting and cancelled slots work.
3. Test deal drag, keyboard, notes, task completion/snooze, sequence drafts and refresh persistence with actual sessions.
4. Perform desktop 1440px, tablet 1024/768px, phone 375px and iOS Safari layout QA, including software keyboard and horizontal board.
5. Verify records, sending consent, sender/provider connections, unsubscribe, bounced email and safe retries before enabling any messaging.
6. Deploy **only** the allowlisted independent buyer build on a buyer host when approved. Never deploy the legacy root as the commercial app.
