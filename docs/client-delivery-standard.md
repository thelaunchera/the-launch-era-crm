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
- **Current Booking Page policy:** The Launch Era manages customer booking confirmations, owner notifications, and up to two follow-ups. No buyer Resend account or independent sending domain is required. All email sends and inbound replies use the centralized platform infrastructure with tenant-scoped reply aliases. Never activate outgoing follow-ups before final delivery.

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

## Evidence-based release QA (October 2026)

- **Never send final delivery based only on checked boxes.** The private sample-lead routing test must actually pass and produce a server-side QA record before the owner can finalize delivery. This is enforced by `tle_booking_flow_owner_finalize` and applies to every buyer.
- Check booking page rendering on a real phone, actual buyer password login, active service/availability setup, CRM tenant isolation, and owner/customer notifications. A simulated email delivery test alone is **not** a full booking test.
- Treat managed follow-ups as **pending** until account delivery, booking-email provider acceptance, reply routing, unsubscribe and stop conditions are verified. Managed email status is independent of legacy buyer Resend connection state.
- The sign-off system stays **blocked** when required evidence is missing. Do not use production bookings or reach out to genuine customers as substitutes for QA; use synthetic records and clean them up.
- After owner and buyer approvals, carry out one controlled post-delivery booking/email smoke test, then confirm that the client can manage new requests. Fix any failure before encouraging the buyer to share their link.

### Additional operational QA findings — October 10, 2026

- In a safe transaction, check a buyer password-authenticated role can access **its own** lead and notification, but not a synthetic lead/notification or workspace belonging to another client. Roll back test records.
- In a separate rolled-back test, insert two future follow-up steps and confirm that **reply** and **withdrawn consent** each cancel pending steps. The trigger now includes `replied_at` in its watched UPDATE columns.
- The legacy Booking Flow follow-up worker must never send before delivery or for any modern private buyer CRM. The managed `tle-booking-managed-followup-worker` checks signed incoming reply receipts, sends only for eligible open quotes using The Launch Era email provider, respects unsubscribe, and prevents duplicate claims. The old buyer-specific Resend workflow must remain inactive for managed orders.
- Managed booking orders no longer need a customer-owned email provider. They must pass the agency-managed end-to-end send, receive, reply-to-owner and stop-follow-up tests. A transactional confirmation alone is never enough to claim full readiness.
- CB Depot: password sign-in evidenced; cross-account lead/notification isolation simulated successfully; sample routing verified and cleaned; replied/withdrawn follow-up stop tests passed. Customer email test delivered to the agency inbox. Final booking mobile smoke test, actual owner email notification, buyer email-sender/reply verification, and buyer design approval remain outstanding.

### Platform-managed mail implementation (October 10, 2026)

- The Booking Page server function `tle-booking-flow-inquiry` sends the customer confirmation and business notification through The Launch Era/Make, sets per-request Reply-To `r-<lead-uuid>@nupelke.resend.app`, and schedules the first managed reminder only after provider acceptance and delivery.
- The signed `tle-crm-resend-events` webhook invokes `tle_booking_managed_reply_route` to authenticate the received event, match the sending customer and original tenant, clear pending follow-ups, log the notification and forward the reply to the owner. Duplicate event replays are idempotent.
- The managed follow-up job runs every 20 minutes using a worker token; it checks the Resend incoming mailbox before choosing a due reminder. Any unprocessed incoming buyer reply blocks the next reminder instead of risking an unwanted email.
- All managed replies and follow-up test data must be deleted after QA. The private test verified reply-stop and forwarding to the agency inbox, but real CB Depot owner notification and real post-delivery booking still require final QA and buyer approval.
- Buyers should see `Managed by The Launch Era` in the Email Automation panel. Do not show customer Resend API key forms on this product.

## Manual 12-hour client design-review reminder

- Applies to the Booking Page + Command Center client approval stage, not to customers making a booking. The owner may send **one manual review reminder per design/retest cycle** from **Owner Settings → Client Delivery**.
- The 12-hour clock begins only when the personalized design has been approved for preview **and** the buyer's private access invitation was sent; on a corrected retest it begins at `ready_at`.
- The reminder button is never shown as ready before 12 elapsed hours; it disappears when the buyer approves, requests changes, or the order is delivered. Reminders do not use revisions or count as the final handoff.
- A server-side transaction claims each reminder once, prevents duplicates across devices and checks buyer status before sending. A failed/ambiguous provider response must be investigated rather than automatically retried.
- The bilingual email directs the buyer to their own private Test Center to choose Approve & Continue or Request Changes. No automatic reminder job is scheduled.

### Standard email presentation and preview for all future buyers

- Use the branded, reusable master `email-templates/client-design-approval-reminder.html` for manual 12-hour design-approval reminders. Presentation: Soft Black `#191919` masthead, Butter Yellow `#F2D85B` logotype accent, Warm Ivory `#FAF8F3` body, restrained Soft Blue highlight, 580px responsive table layout and one prominent CTA button. No exposed raw review URLs in HTML.
- Language follows the buyer account (English or Spanish) without mixed-language paragraphs. Every buyer receives their own business name and private Command Center CTA; never a previous buyer's design, favicon, reviews or appointment claims.
- Before the first production use or any template change, send a **[TEST]** email to the agency owner, verify Gmail inbox arrival and visual readability on mobile, and keep the actual customer's review/reminder untouched.
- The reminder is explicitly identified as a **design review, not final delivery**. Keep the existing 12-hour due gate, one-send-per-cycle protection and owner-only send action.
