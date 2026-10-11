# The Launch Era — Reusable Client Command Center Standard

Last updated: 2026-10-10. **Design and acceptance checklist — not an assertion that all items are live.**

## Scope
Applies to all future client Booking Pages + Command Centers. The Launch Era continues to specialize in cleaning businesses, while the system may be adapted to car detailing or additional service industries.

## Client identity
- Derive company name, service category, approved hero photo, logo, preferred language and palette from that customer's own intake/approved assets. Never reuse a previous customer's branding or data.
- Use the customer's palette for their internal app. CB Depot's graphite/champagne choices do not apply to other clients.
- Make the dashboard greeting a wide, responsive hero image/banner with readable company-specific heading, generous height, good contrast, and natural mobile cropping; never a tiny square image.
- Test all cards and controls at mobile, tablet and desktop widths and prevent sideways overflow.

## Dashboard and settings
- Present real and current metrics only: pending inquiries, quote requests, confirmed appointments and follow-up status. Empty means zero, not fake activity.
- Provide quick actions for Inbox, Add Inquiry, Create/Review Quote, Calendar/Availability and Business Settings, controlled by feature readiness.
- Business Settings sections: business profile, language, booking and requests, services and pricing, availability, notification status, email sender/replies/follow-ups and security. Show accurate connected/paused/unverified states.
- Use understandable customer-facing terms specific to cleaning, detailing or other configured trade.

## New-buyer authentication
- Email confirmation alone is NOT final application authorization. An initial buyer must set a private password, then sign in with email + password before accessing private records.
- **Requested future password UX:** minimum 8 characters with at least one digit and matching confirmation. Verify the live client and server-side password policy are updated consistently before advertising this requirement; some existing code may still require 12.
- Guard private API operations and rows on the server; don't rely on hidden UI or a "loading" card for security.
- Offer password reset and a friendly expired-link state. Secure, unique links must open the buyer's own workspace and must not expose raw HTML or a different product site.

## Lifecycle-based status
- `setup`: gentle "We're finishing your setup"; read-only owner preview only, no live booking / emails / charges from preview. Show actionable next steps, not alarming technical errors.
- `activated_not_delivered`: show private account with setup progress and accurate unavailable/disabled business features.
- `delivered_live`: switch temporary banners to true live states, fetch actual counts, and reveal corresponding working actions only after final QA.
- `automations_pending`: never claim follow-ups and confirmation emails work until verified business sender/reply monitoring/permissions are configured.
- Quote request receipt != confirmed appointment. Check availability and deliberate owner confirmation before promising a reserved date.

## Progressive sidebar
- Prior to final delivery keep the essentials accessible: Dashboard, Inbox, Customers, Settings and relevant setup help.
- After verified release show Pricing & Services, Availability, Automation, Email History, Notifications and future Reports only when available/enabled/authorized.
- Hidden navigation must not be treated as authorization; enforce access controls in backend.

## Reusable owner QA checklist
- [ ] Paid purchase and business category match the correct isolated workspace.
- [ ] Correct logo, palette, approved hero photo and EN/ES wording in both landing and Command Center.
- [ ] No confusing third-party, TLE-owned or previous customer assets.
- [ ] One-time activation, create-password + returning sign-in, server authorization and password reset tested on a real phone.
- [ ] Public Booking Page is inaccessible before approved delivery; owner's preview is view-only.
- [ ] Inbox, quote response, booking acceptance, final confirmation, reminders and follow-up stop rules tested using trade-specific content.
- [ ] Verified sender, reply mailbox, browser permissions and notification state truthfully represented.
- [ ] Mobile/tablet/desktop layout fits, includes wide hero, readable controls, no horizontal overflow.
- [ ] Owner signs off final QA. Publish live page, change setup-to-live statuses and reveal applicable sidebar modules.
- [ ] Test final links for correct recipient; record actual delivered / signed-in / delivered-final status separately.

Reference in Notion: CLIENT PORTAL SETUP — OWNER ONLY
https://app.notion.com/p/3dca68f2ee6e8194823bc2c5b3e21bbc

This file specifies the reusable product direction. Changes to the actual login rules, dynamic statuses, hero layout, and feature flags require implementation and testing before being described as shipped.

## Mandatory industry-aware branded email and secure activation gate (2026-10-11)

The following checks apply to **every new paid client** and every owner-managed change to booking email templates. A delivered customer should never see another customer's branding, an incorrect service category, or a new-workspace form for an already purchased account.

### Source of truth and isolation
1. Checkout/payment → paid `tle_booking_flow_accounts` record. Only a verified paid purchase may activate a private client workspace; never disable or work around the paid-order authorization gate.
2. Buyer intake → explicitly selected `business_category` (`cleaning`, `detailing`, or `other` with a written description), language, owner email and business name. **Do not infer cleaning when the category is missing.**
3. Owner-approved `tle_booking_page_branding` → customer-specific name and logo. Approved logo for HTML email must be a publicly accessible HTTPS **PNG/JPG/WebP**, not SVG or temporary signed image. Use the approved CB Depot PNG email asset for CB Depot; NEVER reuse it for other customers.
4. Payment, intake, verified buyer email, company category, approved logo, one unique private workspace, authenticated owner account and design approval must be checked together. A demo or a guessed customer identifier does not count.

### Email identity for every real customer notification
- For booking receipt, owner alert, quote, accepted/declined quote, confirmed appointment, manual updates and follow-ups: use that customer's approved **company name and logo** from the matching account ID. The public recipient sees the service company's display name; the verified sending domain remains The Launch Era's infrastructure.
- Use sector-specific language: cleaning → home/property; detailing → vehicle/service; other → the explicitly named service category. Preserve the recipient's language (EN/ES) and avoid unsupported claims.
- State the true request status. Quote receipt is **not** a confirmed booking; only a verified, available slot and explicit allowed confirmation flow may say confirmed.
- Reply-to goes to the correct owner/verified reply-monitor address, never another buyer's mailbox. Follow-ups honor consent, replies, unsubscribe, declines, stop status and configured ownership.
- Brand assets are tenant-specific. A missing logo fails **pre-delivery QA and activation**; no stock illustration or random brand may replace it. Fix the asset in owner review first. Operational messages must remain truthful even when a legacy account lacks a logo.
- Both recipient-facing **From** display name and email header must be checked using the shared transactional email router. Activation emails are explicitly from The Launch Era, and show the buying business with its logo inside.

### Activation email — release-critical
- Use `tle-booking-owner-studio` preview and preflight, with the persisted buyer industry rather than an editable fallback or a last-minute guess.
- Subject must name the buyer's company. Email header shows The Launch Era as administrator; prominent business name and approved logo identify whose private Command Center is being activated.
- One prominent **Activate my Command Center** button, plus a second **Open secure link** button as fallback; avoid exposing the raw activation token/link in visible body text. Explain the activation and password step succinctly in the purchaser's language.
- Link must bind to the already paid account's matching authenticated email and matching `crm_workspace_id`. Returning buyers sign in with the email from their paid order, not a second account. Never allow a client to create a fresh unpaid workspace to bypass failed association.
- Prevent duplicate activation dispatch. Record provider accepted vs actually delivered separately; do not report delivered based on handoff only. Password-required, session and RLS tenant authorization must be tested.
- Final live delivery is separate from activation. Do not show unverified completed/live banners before human QA and the customer's design approval.

### Final test matrix, before each delivery
- [ ] Open owner preflight: `paid`, `intake`, `design`, `business_category`, `branded_email_logo`, valid service, hours and booking-page checks must pass.
- [ ] Compare buyer's verified account email and workspace owner. Test existing-buyer sign-in, wrong-account switch, password reset and tenant isolation on real mobile and desktop devices.
- [ ] Preview branded activation EN/ES where relevant; inspect **correct brand logo** (Gmail/mobile supports the chosen PNG/JPG), category and safe button destination. No duplicate sends.
- [ ] With an authorized test email only, submit a quote and (where supported) a booking. Verify customer receipt and business notification display the real logo, correct industry, readable formatting and requested/confirmed status.
- [ ] Validate quote/accept/decline/talk, cancellation/rescheduling, follow-up pause and manual last contact. No cross-account data, no contradictory confirmations.
- [ ] Check sender display name, verified sending domain, reply-to, provider accepted/delivered/bounced, and mobile/tablet/desktop rendering. No active connection or webpage should be reported as passing without a real test.
- [ ] Record QA results, owner sign-off, client design approval, test time and final link. **Keep delivery blocked until failures are resolved.**

Implementation audit 2026-10-11: Updated Supabase functions for Booking Inquiry (v25), Owner Studio activation (v34), Buyer Request Center (v11), Quote Response (v6), Buyer Follow-up Worker (v6) and Intake (v20). Updated Make shared transactional email router module 17 to use the buyer company as From display name. These are source/deployment checks, **not** proof that a live end-to-end customer inbox and sign-in test has passed; conduct the test matrix above before declaring verified delivery.
