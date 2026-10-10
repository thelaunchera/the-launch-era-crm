# The Launch Era — client delivery standard (all future buyers)

**Owner-only.** Cleaning businesses are our primary market. Car detailing and other services are supported only with industry-appropriate services, terminology and automated messages.

## Production clock

- Default production window: **48 hours**, beginning after verified payment **and receipt of all required intake and brand assets** at the next permitted production start.
- Team hours: Monday–Friday 9:00 AM–5:00 PM; Saturday 8:00 AM–noon (America/New_York).
- Orders after **Saturday 12 PM** do not begin production until the next business day. Do not imply Sunday kickoff.
- Use identical language in the product pages, agreements, FAQ, purchase confirmation and handoff message; checkout success must mention checking **Promotions** and **Spam/Junk**.
- Never falsely show production started merely because a checkout completed.

## Buyer-specific design

- Create a distinct private workspace linked to the paid buyer, with business-category-aware labels, quote flow, follow-up copy and confirmations. No business sees another buyer's customers.
- Copy the **approved landing hero photo into a wide panoramic greeting card** with sensible crop, dark contrast overlay, responsive mobile portrait crop, live stats, quick actions, and no square thumbnail. Use the buyer's own approved photo/colors; CB Depot car images and black/champagne palette are specific to CB Depot.
- Show a clean pre-delivery state only while incomplete; once truly delivered switch to real activity, not fabricated counts or false automation statuses. Stage sidebar functions based on actual readiness.

## Security

- Customer receives one-time identity-verification link; then chooses an 8+ character password with >=1 number and explicitly signs in. Email-link-only sessions must not expose private workspaces.
- The customer's outbound email connection must be individually verified. Do not send from TLE on the buyer's behalf, or say automations are active if verification is pending.

## Footer / legal

- Individual buyer footer should show brand, **professional service** description, Privacy Policy, Booking Terms, and working Contact link.
- **Licensed** and **Insured** badges/claims only if the actual buyer has confirmed or provided valid evidence; neither can be presumed from service type.
- Keep per-buyer policies and contact details accurate; never use TLE privacy as the buyer's own policy.

## Private testing before public release

1. Owner reviews private buyer landing from **Owner Settings > Client Delivery > Review Booking Page safely**, not the public (locked) URL.
2. Verify actual service copy, photos, responsive layout, prices, calendar and terms.
3. Submit a QA inquiry in the owner's preview using the secure postMessage + nonce bridge. The backend must verify the paid buyer/workspace, create a test inquiry with an invalid test-only email, verify CRM routing, remove test records, **never email a real contact nor reserve a slot**, and return explicit success or failure.
4. For customer-facing actions (quote acceptance, booking confirmation, reminders), run separate authorized tests to controlled test inboxes, preserving statuses and stop conditions. The private lead QA is not proof that live emails were delivered.
5. Do not check final QA boxes unless individually verified. Approve delivery only after all steps; turn on public URL after release.
6. Send activation vs final delivery as separate stages; prevent duplicate activation emails and show real provider delivery status.
7. After delivery, refresh the preview and public link and verify actual inbound customer requests.

## Client categories

- **Cleaning:** residential service packages, one-time and recurring, clean-specific booking/quote/followups.
- **Car detailing:** vehicle type and condition, interior/exterior/full detail, vehicle-specific quotes, confirmed appointments only after available-slot confirmation.
- **Other service:** neutral/custom copy and intake taxonomy; do not show cleaning-specific strings.

## Implementation pointers

- Command Center: `index.html` — buyer dashboard, greeting, owner live preview and QA checklist.
- Source of panoramic CB photo: `https://thelaunchera.com/assets/clients/cb-depot/photos/hero-desktop.webp` (mobile `hero-mobile.webp`). Replace with each buyer's own asset.
- Customer template and legal pages: `thelaunchera/the-launch-era-new-website-` `public/base-booking.html`, `public/assets/booking-template-live.js`, `public/cb-depot/privacy/`, `public/cb-depot/terms/`. CB-specific pages are examples, not templates to copy verbatim.
- Owner QA verification: Supabase `tle-booking-owner-studio` action `qa_test_lead` -> service-role-only `tle_booking_owner_qa_lead_route_sample` RPC.
- See the matching Notion reusable delivery standard under **04 — CLIENT DELIVERY — PAID CLIENTS**.

**Always prefer verified customer facts to marketing guesses.**
