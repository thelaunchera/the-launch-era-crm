# The Launch Era — 7-day sales pilot (2026-10-20)

**Status:** Private technical preview; does not change production, does not send emails, does not modify Supabase or the public booking demos.

## Goal
Improve the path from prospect discovery to a useful private preview and measurable commercial follow-up, without installing a second CRM or buying subscriptions.

## Work completed / evidence
- Audited Seamless saved contacts on 2026-10-20: 60 contact records; 41 had provider-reported 'valid' email and were outside Florida. This is NOT proof of mailbox deliverability, interest, consent or qualification.
- Reviewed 600 most recent Resend outgoing email records; none of these 41 email addresses exactly matched the reviewed recipients. This is partial: the account had older records and other channels were not reviewed. Separately checked all 125 currently returned CRM leads in the TLE owner workspace (including archived records); 0 of 41 candidate companies matched on exact email, normalized business name, or matching company-domain evidence. Do not mark anyone "never contacted" until older sends, suppression list, prior Drive research and other channels have also been checked.
- Reviewed Maid in Nashville (maidinnash.com) homepage and quote request page as public sources, and produced a proposal for a clearer three-step booking inquiry. They **already offer a quote request path**; do not claim they have no online booking or that their current form is broken.
- Built a standalone, responsive three-step demo at sales-pilot/maid-in-nashville-preview.html. This is NOT an official site and does not transmit or save customer data. Live slots, estimates, addresses, notifications, reviews, payments, and backend operations remain unconnected.
- Read pricing pages for ZenMaid, BookingKoala and Launch27. Monitoring through Firecrawl was NOT activated because its simple monitor schedule rejected weekly text, followed by an account rate limit. No subscription or monitoring plan was purchased.

## Qualified shortlist to review (NOT cleared for outreach)
| Company | State | Website | Reason for review |
|---|---|---|---|
| Maid in Nashville | Tennessee | https://maidinnash.com/ | Three publicly listed service categories; chosen for private demo |
| Maid 4 Moms | Idaho | https://maid4moms.com/ | Existing book/quote path; potential opportunity for a smoother flow |
| Maid Healthy Inc. | Maryland | https://maidhealthy.biz/ | Existing provider-valid address; site audit not finished |
| Maids on a Mission | Texas | https://maidsonamissionus.com/ | Existing provider-valid address; site audit pending |
| Maid in America | Georgia | https://maidinamericaga.com/ | Existing provider-valid address; site audit pending |
| Maid Naturally | Washington | https://maidnaturally.com/ | Existing provider-valid address; site audit pending |
| Maid Perfect | Virginia | https://maidperfect.com/ | Existing provider-valid address; site audit pending |
| Maid 2 Impress | Colorado | https://maid2impress.net/ | Existing provider-valid address; site audit pending |
| Cleaning for College LLC | Virginia | https://cleaningforcollege.com/ | Existing provider-valid address; site audit pending |
| Cleaning Done Right | Arizona | https://cleaning-done-right.com/ | Existing provider-valid address; site audit pending |

These are leads to REVIEW, not endorsements and not an assertion that they need the product. Contact information remains in Seamless, not this source repo.

## Pre-send gate (mandatory)
1. Inspect website for actual need and possible objection, with source and date.
2. Deduplicate by both **domain and email** against previous outreach, the full historical Resend send list (not just contacts), suppression and opt-outs, and any other contact channel. The TLE Supabase CRM 125-row read was completed on 2026-10-20, with no exact candidate matches; re-check immediately before sending.
3. Check commercial fit, business geography, current email status, relevant rules and opt-out/consent requirements. Provider status 'valid' is not a real-time mailbox verification.
4. Draft an individual, genuinely useful first email (no link initially). Do not send from this pilot or automatically.
5. When someone responds interested, supply verified, tested private preview as appropriate; never claim a concept preview is their live system.

## Metrics — fill after each day
Use sales-pilot/metrics.csv. Distinguish sourced, eligible, delivered, replied, demo requested, demos viewed, deals won. Record exact dates and avoid inferring conversion rates from tiny samples.

## Competitive monitoring
Market baselines from official pages (as observed on 2026-10-20):
- ZenMaid starter/pro/pro max: $19/$39/$49 per month (https://get.zenmaid.com/pricing)
- BookingKoala starter/growing/premium: $27/$57/$197 per month (https://www.bookingkoala.com/pricing)
- Launch27 base/pro/plus: $75/$150/$299 per month (https://www.launch27.com/pricing/)
The comparison is informational, not a like-for-like feature comparison, and pricing can change. A scheduled monitor is NOT yet active; request separate review of usage costs before enabling recurring checks.

## Acceptance criteria before any production integration
- Responsive screenshot review at 390px, 768px and desktop + service cards photo loading from licensed sources.
- Keyboard navigation, contrast, error states, all three steps, repeat flow and no horizontal scroll.
- No external writes, invoices, bookings, notifications or customer data collection from this prototype.
- No fake reviews, outcomes, live pricing, or fabricated real-time availability.
- Any new CRM automation must respect tenant isolation and avoid duplicate outbound communications.

## Seven-day agenda
Day 1: Dedup / fit review; Day 2: Preview QA; Day 3: 1:1 outreach drafts only; Day 4: Measure responses; Day 5: Follow-up eligibility review; Day 6: Review demos requested; Day 7: decide stop, change or continue based on evidence.
