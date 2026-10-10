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
