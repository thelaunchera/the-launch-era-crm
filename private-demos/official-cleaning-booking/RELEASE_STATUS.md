# Official Cleaning Booking Demo — release status (2026-10-18)
**Status: SOURCE COMMITTED; PRODUCTION DEPLOY PENDING.** Never claim the new 52 px Sonny icon and 16 card photos are visible to owner or prospects until the production `tle-booking-demo-gate` function has been redeployed from the private canonical source and visually checked.

## Latest approved change
- Source: `private-demos/official-cleaning-booking/index.html`
- Commit: `ada00b6b9f6559f1a1d37c5f6e614321a8ed0174`
- Closed Sonny is now avatar-only: 52 px circular button, screen-reader label "Chat with AI Assistant", no unsolicited greeting popup, compact opt-in AI chat remains available. On mobile the icon docks above the sticky booking CTA, and hides while booking inputs are focused.
- Added 16 distinct same-site photos into Why Homeowners Choose Us, How It Works, Cleaning for Every Space, More Than Just Cleaning; no card repeats and no unrelated customer assets used. Existing service cards and hero photos were preserved.
- English/Spanish, demo-only booking form, protected signed invitation access, owner-only iframe relay, and other templates were not modified.

## Source validation
- All 16 image files are present in active website repo `thelaunchera/the-launch-era-new-website-`, under `public/assets/`.
- All 4 inline JS scripts passed parse checks; 22 assigned hero/team/service/card photos are distinct, and no booking form data send was introduced.
- No unsafe public raw HTML file was created.

## Deployment blocker
- Production Supabase `tle-booking-demo-gate` is still **v28 ACTIVE**, which serves the previous visuals. Two attempts to update **only** `booking-template.ts` via the deployment connector were rejected by platform safety checks. Do not assume the backend was updated and do not keep retrying a blocked action.
- Resume only via an authorized deployment route after reviewing the block. Preserve the current `index.ts`, `booking-legacy-template.ts`, `tracker-template.ts` and `verify_jwt=false` with its existing server-side owner/lead authorization.
- Once deployed, test private owner modal on iPhone, prospect signed EN/ES invitations, Sonny bubble open/close/AI reply, service cards, photos loaded, booking 3 steps, and mobile scroll/CTA visibility. Do not create real bookings or send lead emails in QA.

## 2026-10-19 — branch-only repeat-booking reset fix
- Verified defect: the sample prefilled a future date using the live input value only; the local form reset cleared it. The private demo now recomputes and restores the minimum and selected date after reset.
- Scope: private canonical source only; public `/booking-demo/` request funnel, production function, existing slider styling, and other tenants were not modified. No production deployment or booking submission occurred.
- Local QA: 24 assertions passed at each of 320, 360, 375, 390, 768, 820, 1024, 1280, and 1440 px (216/216 total), including two consecutive local completions, step navigation, name/phone/address/ZIP/date validation, Spanish validation/success copy switching, and slider movement. No horizontal overflow or JavaScript console errors; all four inline scripts parse.
- Google Drive was unavailable in the QA session (no connector or OAuth credentials), so no approved matching photo pair could be verified. The existing illustrative slider gradients remain unchanged; no stock or unrelated images were used.
- End-to-end private owner/invitation access and email delivery remain unverified. The sample form is local-only; production verification must use an authorized test route/inbox and must not send real bookings or lead emails.
- Existing bilingual limitation noted: the dynamic Spanish completion summary still contains English service/date/time/estimate fragments; this branch did not alter that behavior.
