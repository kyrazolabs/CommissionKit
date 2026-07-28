# Memory — AFFiNE Revenue OS + Lead Capture System

Last updated: 2026-07-08

## What was built

### AFFiNE Revenue Operating System
Created 8 docs under `02 Revenue Strategy` in AFFiNE (`workspace: dd885096-c02d-4007-af60-c8d974a20c23`):

**Marketing databases** (under `02 Revenue Strategy > Marketing` folder):
- `Qm9EkenhNp` — **Content Calendar**: 6 columns (Pillar, Status, Target Keyword, Due Date, Author, URL), 5 seed rows
- `OE3o_zi_Li` — **Social Media Calendar**: 6 columns (Platform, Type, Status, Scheduled Date, Engagement, Link), 5 seed rows
- `Z7_OjFsaDu` — **SEO Keyword Tracker**: 6 columns (Target URL, Current Position, Target Position, Volume, Difficulty, Status), 5 seed rows
- `129s6AfHWA` — **Lead Magnet Tracker**: 5 columns (Type, Status, Downloads, Conversion Rate %, URL), 3 seed rows

**Sales databases** (under `02 Revenue Strategy > Sales` folder):
- `aA9Xs1N9Gh` — **Leads Database**: 9 columns (Contact, Title, Email, LinkedIn, ICP Fit, Status, Source, Notes, Last Contacted), 3 seed rows
- `y7ug39VIj2` — **Outreach Campaigns**: 8 columns (Channel, Status, Sent, Opened, Replied, Meetings, Start/End Date), 3 seed rows
- `n1mwsfVXsz` — **Deal Pipeline**: 5 columns (Contact, Value, Stage, Close Date), 3 seed rows

**Hub**: `dY779WXU-W` — **Revenue Command Center**: Weekly metrics snapshot table + 7 embedded database cards. Under `02 Revenue Strategy`.

### Lead Capture Backend
- `lib/db/src/schema/leads.ts` — Mongoose `Lead` model: email (unique, indexed), source (hero/calculator), name (optional), ip, userAgent, status (new/contacted/converted/disqualified), metadata, timestamps. Upserts on duplicate email.
- `lib/db/src/schema/index.ts` — Exports leads schema
- `artifacts/api/src/routes/leads/routes.ts` — `POST /api/leads`: Zod validation, `leadRateLimit` (5/hr/IP), saves to MongoDB via `findOneAndUpdate` with upsert, sends `leadNotificationTemplate` email via `sendMediumPriorityEmail` to sales@commissionkit.co
- `artifacts/api/src/middleware/rate-limiter.ts` — Added `leadRateLimit` function
- `lib/email-templates/src/lead.ts` — `leadNotificationTemplate` HTML email
- `lib/email-templates/src/index.ts` — Exports `leadNotificationTemplate`
- `artifacts/api/src/routes/index.ts` — Wired `leadsRouter`
- `artifacts/api/src/routes/leads/routes.test.ts` — 5 tests, all passing

### Lead Capture Frontend
- `artifacts/web/src/pages/landing/Hero.tsx` — Fire-and-forget `fetch(POST /api/leads, { source: 'hero' })` with `keepalive: true` before redirecting to `/register`. Non-blocking.
- `artifacts/web/src/pages/commission-calculator.tsx` — Headline results (Commission, Effective Rate, Deal Amount) always visible. Full breakdown, CTA card, comparison cards gated behind email capture with Mail icon, loading spinner, error handling. Posts `{ source: 'calculator' }`. Pre-fills email from URL params.

## Decisions made

- **Lead storage**: MongoDB is primary operational store. AFFiNE Leads Database is the visual tracker. MongoDB has upsert (same email updates existing lead).
- **Hero capture pattern**: Fire-and-forget (fetch + keepalive). Does not block redirect to `/register`.
- **Calculator gate pattern**: Teaser first (headline results free), full value gated. Rewards engagement, captures leads.
- **Rate limiting**: Same pattern as apply route — 5 requests/hour per IP.

## Problems solved

- No pre-existing lead capture infrastructure existed — built from scratch (model, route, rate limiter, email template, tests).
- Calculator was 100% free with no conversion path — now works as a proper lead magnet.

## Current state

- All 8 AFFiNE databases created, structured, and seeded. Ready for use.
- Backend: Lead model + API route fully built and tested (5/5 tests pass).
- Frontend: Hero + Calculator both wired to the new `/api/leads` endpoint.
- AFFiNE Leads Database is NOT auto-populated from API — leads currently arrive via email only.
- `os/STATUS.md` and `context/progress-tracker.md` updated with all new entries.

## Next session starts with

1. Run `/remember restore` to pick up this context
2. **AFFiNE sync**: Build a script or scheduled task that pulls MongoDB leads into the AFFiNE Leads Database (`aA9Xs1N9Gh`) — currently leads only arrive via email
3. Deploy and test the lead capture flow end-to-end in staging/production
4. Optionally wire Twenty CRM as the canonical lead store if CRM integration is desired

## Open questions

- Should the AFFiNE sync be a scheduled BullMQ worker or a manual sync script?
- Does the calculator gate need A/B testing on the free-vs-gated ratio?
- Should hero lead capture also save name (if collected via a multi-step form)?
