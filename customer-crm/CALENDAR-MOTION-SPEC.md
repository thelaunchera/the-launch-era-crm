# Calendar UI standard for future customer Command Centers

Reference: BrewedOps Motion Library - Booking calendar (app-crm-booking).

## Design
- Premium, responsive calendar with white surfaces, pale-blue background, soft-blue accent #6FAFDC, dark ink #191919, rounded cards, low shadows and subtle spring interactions.
- Default week view with a reversible month view using the existing functioning calendar. Use real dates, status chips and native customer request action paths.
- Small screens: independently scrollable day rail, no horizontal document overflow or clipped controls. Support iPhone Safari, tablet and desktop.
- Reduced motion: remove decorative animations but keep every action accessible.
- Provide helpful empty, loading and error states. Never fabricate bookings, event times, revenue or notifications.

## Product and tenancy boundaries
- Customer CRM is not The Launch Era private owner Command Center. Never include private clients, Idea Vault, internal Jessie agents, tools, automations, owner orders, notes or datasets.
- CB Depot is CAR DETAILING. Preserve its logo, photos, notification recipients, legal policies, booking workflow, client approvals, legacy route and tenant.
- Each new buyer gets their own workspace and industry branding. Calendar queries must pass verified owner/workspace authorization and backend RLS; never use an email address alone as the business identity.
- The week view is presentation-only: read actual authorized bookings and call native appointment/detail handlers. Do not mutate bookings, fake slots or copy business data to another tenant.
- The commercial customer CRM Booking Calendar remains NOT CONNECTED until verified booking-account authorization exists. This spec is not a live feature flag.

## Release protocol
1. Run authenticated two-tenant isolation tests and verify roles.
2. Test at 360, 390, 768/820, 1024, 1440px, including phone booking, quotes, change requests, refresh and cancellation flow.
3. Preserve CB Depot's grandfathered Cloudflare address. Do not redirect without explicit approval.
4. Verify CI, actual Worker deployment and browser QA before calling it published.
5. Keep the original monthly calendar as an immediate fallback.
