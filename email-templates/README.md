# The Launch Era — Auth emails

These are **Supabase Go HTML templates** for Authentication → Email Templates: Confirm signup, Invite user, Reset password. They are **source files only**; adding them to GitHub does not change Supabase Auth's actual templates.

Use `{{ .ConfirmationURL }}` exactly as written. Never substitute a demo link or a static URL for a verification token. The sender should be The Launch Era <hello@thelaunchera.com> through verified SMTP.

**Critical Auth URL correction:** Under Supabase Authentication → URL Configuration, set Site URL to `https://the-launch-era-crm.dailinsegura17.workers.dev/` and include the same HTTPS site in Redirect URLs before sending a new invitation. The current default confirmation links have redirected to an old `/cleaning-app/` page. Verify any other live products' authentication redirects are covered before changing shared Site URL.

**Do not resend** an invitation just to test these files. Use an internal test address after configuration and inspect the complete verification flow. Never share or log an actual one-time token. Remove or delay bulk cold-outreach from the transactional sending domain; this requires a separately authenticated sending domain and gradual reputation building.


## Reusable client design-approval reminder

- **Master HTML:** `email-templates/client-design-approval-reminder.html`. This is the reusable, mobile-friendly premium The Launch Era layout for all Booking Page + Command Center buyers.
- The active backend is `tle-client-review`; its reminder email embeds this master design, replaces the language/business/CTA fields, and sends through the official transactional sender. Keep the master and deployed HTML synchronized when editing the design.
- English and Spanish use the same visual shell, with localized text and one `Open My Test Center / Abrir mi Centro de Pruebas` button. Do not show raw private links in the HTML. The business name is filled per buyer; never hardcode CB Depot or reuse another buyer's branding.
- A reminder is not final delivery and must never claim the booking system is live or that an appointment has been confirmed.
- The manual reminder is available after 12 hours without approval or a correction request. Only the owner may click Send Client Reminder; one attempt is allowed per review cycle. No automatic sending.
- **Testing rule:** Send an email marked `[TEST]` with a conspicuous test-only banner only to the agency test inbox. Confirm actual inbox arrival and appearance before delivering this feature. Never send test reminders to buyers.
- Initial verified test: 2026-10-10, sample client CB Depot; the email arrived in the agency Gmail Inbox / Updates and the real client's review state was unchanged.
