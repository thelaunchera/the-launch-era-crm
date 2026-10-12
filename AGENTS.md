# The Launch Era Command Center — Mandatory QA Instructions

**Before ANY change**, read the canonical project QA skill and map:
- https://github.com/thelaunchera/the-launch-era-new-website-/blob/main/skills/the-launch-era-qa/SKILL.md
- https://github.com/thelaunchera/the-launch-era-new-website-/blob/main/skills/the-launch-era-qa/ROUTE_MAP.md
- https://github.com/thelaunchera/the-launch-era-new-website-/blob/main/skills/the-launch-era-qa/INCIDENT_LOG.md

This CRM repo owns \`index.html\`, \`access.html\`, \`lead-insights.html\`, \`buyer-account-preview.html\`, \`sw.js\`, and email templates. The active website also carries a copy under \`public/command-center/\`. ALWAYS identify which one is deployed before modifying, and verify parity before release.

All workspace and customer records are TENANT-SCOPED. CB Depot is a car detailing client and retains its own photos, legal policies, email sender/notifications and favicon. Do not copy its branding or data to another business, nor send its bookings to cleaning company CRM tables. Do not touch real client or end-customer records for QA. Verify Owner/Admin/Worker access separately.

QA flow: invitation -> access -> login -> reset (/auth-recovery.html) -> successful return to /command-center/ -> protected routes -> calendar/sidebar/refresh -> notifications -> private booking -> owner approvals -> emails -> unsubscribe. On mobile/tablet/desktop every active button must reach intended page, never the marketing home by accident or an empty/404 page. No false claims of deliveries, approvals or AI actions. Test against isolated fixtures and update canonical incident log when corrected. Preserve existing working infrastructure and client-specific Cloudflare exceptions.
