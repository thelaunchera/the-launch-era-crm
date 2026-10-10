# The Launch Era — Auth emails

These are **Supabase Go HTML templates** for Authentication → Email Templates: Confirm signup, Invite user, Reset password. They are **source files only**; adding them to GitHub does not change Supabase Auth's actual templates.

Use `{{ .ConfirmationURL }}` exactly as written. Never substitute a demo link or a static URL for a verification token. The sender should be The Launch Era <hello@thelaunchera.com> through verified SMTP.

**Critical Auth URL correction:** Under Supabase Authentication → URL Configuration, set Site URL to `https://the-launch-era-crm.dailinsegura17.workers.dev/` and include the same HTTPS site in Redirect URLs before sending a new invitation. The current default confirmation links have redirected to an old `/cleaning-app/` page. Verify any other live products' authentication redirects are covered before changing shared Site URL.

**Do not resend** an invitation just to test these files. Use an internal test address after configuration and inspect the complete verification flow. Never share or log an actual one-time token. Remove or delay bulk cold-outreach from the transactional sending domain; this requires a separately authenticated sending domain and gradual reputation building.
