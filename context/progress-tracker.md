# Progress Tracker — CommissionKit

This tracker captures the current state of the codebase as of the latest exploration. Use it to identify what exists, what is stable, and what may need attention.

## Legend

| Status | Meaning |
|--------|---------|
| ✅ Done | Implemented and appears complete. |
| 🔄 Partial | Implemented but may need refinement/testing. |
| ⏳ Planned | Referenced in docs or architecture but not fully present. |
| ❓ Unknown | Not confirmed during exploration. |

## 1. Project Foundation

| Area | Status | Notes |
|------|--------|-------|
| Monorepo setup | ✅ Done | Bun workspaces, project references, root scripts. |
| README / AGENTS.md | ✅ Done | Comprehensive dev + test + design docs. |
| Docker setup | ✅ Done | API, web, blog, database compose files. |
| Nginx dev proxy | ✅ Done | `dev.nginx.conf` documented; HTTPS enabled with HTTP→HTTPS redirect. |
| Environment examples | ✅ Done | `.env.example` in api and web. |

## 2. Backend (`artifacts/api`)

| Area | Status | Notes |
|------|--------|-------|
| Express 5 app | ✅ Done | `app.ts` with logging, CORS, rate limit, auth, router, error handlers. |
| Better Auth integration | ✅ Done | MongoDB adapter, email verification, password reset, Google OAuth, org invitations. |
| Workspace middleware | ✅ Done | `requireAuth`, `requireWorkspaceMember`, `requirePermission`, `requireGrowthPlan`. |
| RBAC | ✅ Done | Redis-cached permissions, wildcard support, custom roles. |
| Health route | ✅ Done | `/api/healthz`. |
| Workspace routes | ✅ Done | CRUD + members + features. |
| Rep routes | ✅ Done | CRUD + bulk import + portal codes. |
| Plan routes | ✅ Done | CRUD with tiers. |
| Deal routes | ✅ Done | CRUD + bulk CSV import/export. |
| Run routes | ✅ Done | Commission run creation + enqueue. |
| Dashboard routes | ✅ Done | Dashboard stats. |
| Reports routes | ✅ Done | Analytics reports. |
| Payout routes | ✅ Done | Payout lifecycle. |
| Dispute routes | ✅ Done | Dispute creation/resolution. |
| Billing routes | ✅ Done | Stripe checkout, subscriptions, webhooks. |
| Notifications routes | ✅ Done | In-app notifications. |
| Portal routes | ✅ Done | JWT rep portal auth. |
| Export routes | ✅ Done | CSV/XLSX exports. |
| Roles routes | ✅ Done | Custom role CRUD. |
| Integrations routes | ✅ Done | Connector config and sync triggers. |
| Enterprise routes | ✅ Done | AISSOL projects, invoices, matrix conditionally mounted. |
| Apply route | ✅ Done | Public POST `/api/apply` with Zod validation, `applyRateLimit` (5 req/hour), env-driven notification emails, BCC field added to `MailJobSchema` and `sendMail()`. |
| Standard calc engine | ✅ Done | Flat / tiered / accelerator + FX snapshots. |
| AISSOL calc engine | ✅ Done | Slab + GM matrix engine. |
| Engine registry | ✅ Done | Bootstrap at startup. |
| Sync workers | ✅ Done | Reps, deals, webhook ingress. |
| Logs worker | ✅ Done | S3 log flush. |
| Exchange service | ✅ Done | `lib/exchange.ts` with rate lookup. |
| Limits | ✅ Done | `lib/limits.ts` + subscription gating. |
| Bull Board | ✅ Done | Secured board at `/api/admin/queues`. |
| Sentry | ✅ Done | API instrumentation + sourcemaps. |

## 3. Frontend (`artifacts/web`)

| Area | Status | Notes |
|------|--------|-------|
| Vite + React 19 setup | ✅ Done | SSR prerender configured. |
| Tailwind CSS 4 + theme | ✅ Done | CSS variables, light/dark mode. |
| shadcn/ui components | ✅ Done | Full primitive set in `components/ui/`. |
| Wouter routing | ✅ Done | Public + protected routes, engine guards. |
| TanStack Query | ✅ Done | Global QueryClient, generated hooks. |
| Better Auth client | ✅ Done | Cookie-based auth. |
| Workspace provider | ✅ Done | Persistence, switching, engine nav items. |
| Theme provider | ✅ Done | Light/dark toggle. |
| Sidebar + Header | ✅ Done | Layout components. |
| Dashboard page | ✅ Done | Main dashboard. |
| Plans / Deals / Runs pages | ✅ Done | Commission management. |
| Reps / Team pages | ✅ Done | Team management. |
| Payouts / Disputes pages | ✅ Done | Payout lifecycle. |
| Reports page | ✅ Done | Analytics. |
| Settings / Billing pages | ✅ Done | Workspace config + Stripe billing. |
| Integrations page | ✅ Done | Connector UI. |
| Portal pages | ✅ Done | Standard + AISSOL rep portals. |
| Landing page | ✅ Done | Full marketing sections. |
| Marketing pages | ✅ Done | Pricing, features, solutions, contact, legal. |
| Careers page | ✅ Done | Public `/careers` listing with company values + open positions. |
| Careers job page | ✅ Done | Public `/careers/:slug` with job details + application form. |
| i18n | ✅ Done | react-i18next setup. |
| Notification bell | ✅ Done | Real-time in-app notifications. |
| Sync indicator | ✅ Done | Mutation + error indicator in header. |
| Currency combobox | ✅ Done | 170+ currencies. |

## 4. Shared Libraries

| Area | Status | Notes |
|------|--------|-------|
| `@workspace/db` | ✅ Done | Schemas, connection, limits, AISSOL models. |
| `@workspace/queue` | ✅ Done | Queues, workers, mailer, enqueue, exchange sync. |
| `@workspace/api-zod` | ✅ Done | Generated Zod validators. |
| `@workspace/api-client-react` | ✅ Done | Generated React Query hooks. |
| `@workspace/email-templates` | ✅ Done | All transactional templates. |

## 5. Plugins

| Area | Status | Notes |
|------|--------|-------|
| `@workspace/plugins-core` | ✅ Done | Base types, registry, transforms. |
| `@workspace/plugins-odoo` | ✅ Done | Odoo connector. |
| `@workspace/plugins-salesforce` | ✅ Done | Salesforce connector. |
| `@workspace/plugins-hubspot` | ✅ Done | HubSpot connector. |
| `@workspace/plugins-custom` | ✅ Done | Generic REST connector. |

## 6. AI Workforce (`os/agents/`)

| Area | Status | Notes |
|------|--------|-------|
| Agent definitions | ✅ Done | 16 agents across 5 teams + Nexus leader. All 16 updated with proper `.agents/skills/` references. |
| Skill registry | ✅ Done | Migrated from 7 legacy `os/skills/` (flat .md) to 27 directory-based skills in `.agents/skills/`. 5 technical skills in `.opencode/skills/`. Expanded with 15 additional skills (analyze, legal-risk, competitive-intelligence, etc.). |
| Task orchestrator | ✅ Done | Nexus routes tasks by skill match, tools, access, workload. |
| Web access layer | ✅ Done | Quota-based browsing (20/hr/agent), full audit trail. |
| CLI interface | ✅ Done | `agents-cli.ts` with status, org, brief, skills, nexus commands. |
| Execution engine | ✅ Done | TypeScript engine with programmatic API. |
| Skill comparison | ✅ Done | Agent-vs-agent task suitability scoring. |

## 7. Testing

| Area | Status | Notes |
|------|--------|-------|
| Bun test runner | ✅ Done | Configured root script with happy-dom preload. |
| API test helpers | ✅ Done | `setup-db.ts`, `preload-db.ts`. |
| DB model tests | ✅ Done | Multiple `*.test.ts` in `lib/db`. |
| Queue tests | ✅ Done | `enqueue.test.ts`, `worker.test.ts`, `mailer.test.ts`. |
| Email template tests | ✅ Done | Multiple template tests. |
| API route tests | ✅ Done | Reps, plans, deals, payouts, disputes, portal, runs, health. |
| Middleware tests | ✅ Done | `auth.test.ts`. |
| Engine tests | ✅ Done | `standard.engine.test.ts`, `aissol.engine.test.ts`. |
| Web hook tests | ✅ Done | `use-auth.test.tsx`, `use-workspace.test.tsx`. |
| Web component tests | 🔄 Partial | `button.test.tsx` exists; more components can be added. |
| Apply route test | ✅ Done | Tests validation and email enqueue mock. |

## 8. Documentation

| Area | Status | Notes |
|------|--------|-------|
| README.md | ✅ Done | Human-facing quick start. |
| AGENTS.md | ✅ Done | Agent-facing conventions. |
| Enterprise engine architecture | ✅ Done | Full spec in `docs/`. |
| Design system | ✅ Done | `context/ui-tokens.md` + `context/ui-rules.md`. |
| Platform overview | ✅ Done | `context/architecture.md`. |
| Payout architecture research | ✅ Done | AFFiNE OS — `https://affine.commissionkit.co`. |
| Context docs | ✅ Done | This folder. |

## 9. Known Gaps / Next Steps

| Area | Status | Suggested Action |
|------|--------|------------------|
| **Setup Checklist & Sample Data** | ✅ P0 — Complete | Backend (Forge): `POST/DELETE /api/workspace/sample-data`, schema changes (`isSampleData`, `sampleDataLoaded`), 12 tests. Frontend (Pixel): `SetupChecklist` overlay, `use-setup-checklist` hook, dashboard integration, 9 tests. 21 total new tests, 0 regressions. |
| Web component coverage | ⏳ | Add tests for tables, forms, dialogs, cards. |
| E2E tests | ⏳ | No Playwright/Cypress detected; consider adding. |
| CI/CD | ⏳ | No GitHub Actions configured; could add lint/test/build workflow. |
| Payout providers | ⏳ | Research is documented; actual provider integrations not yet wired. |
| Mobile layout polish | ⏳ | Verify all complex tables on small screens. |
| Accessibility audit | ⏳ | Run automated a11y checks on key flows. |
| Performance | ⏳ | Audit bundle size and query cache settings. |
| Email deliverability | ⏳ | Verify SPF/DKIM/DMARC for production SMTP. |

## 10. Recent Changes

- **OS migration to AFFiNE**: All company documentation (identity, strategy, revenue, product, operations, people, customer, tools, governance) migrated from `os/` numbered folders to AFFiNE at `https://affine.commissionkit.co`. Numbered folders deleted from repo.
- **os/agents/ restructured**: Team folder structure created with nexus/gtm/marketing/development/product/ directories, each with `workflows/` and `scripts/` subdirectories. Team READMEs and workflow templates created.
- **Documentation updated**: AGENTS.md, os/README.md, os/STATUS.md all updated to point to AFFiNE as canonical business OS source.
- AFFiNE MCP server (v2.5.0) configured and tested — full access to workspace via 95 tools.
- Added pluggable commission engine architecture.
- Added AISSOL enterprise engine and routes.
- Added integration plugins (Odoo, Salesforce, HubSpot, custom REST).
- Added RBAC with custom roles and Redis caching.
- Added notifications, payouts, disputes, and rep portal.
- Added i18n, landing page, and marketing pages.
- Added SSR prerender for SEO.
- Added public application page (`/apply`) with email notification to Abdullah + BCC sales.
- Added **AI Workforce** (`os/agents/`) — 15 named agents across 4 teams with skill verification, task orchestration, web access quotas, and CLI interface.
- Added **OpenCode-native agent configuration** in global `opencode.jsonc` with 15 agents using optimized models.
- Added **7 new business skills** in `os/skills/` (research, content-seo, social-engage, data-report, deploy-verify, design-ux, sales-outreach) all mapped to agents.
- Cleaned and interconnected all markdown files: `AGENTS.md` is the single entry point for both technical (`context/`) and business (`os/`) documentation.
- **Revenue Operations OS built in AFFiNE**: 7 interactive databases (Content Calendar, Social Media Calendar, SEO Keyword Tracker, Lead Magnet Tracker, Leads Database, Outreach Campaigns, Deal Pipeline) + Revenue Command Center hub under `02 Revenue Strategy`.
- **Lead capture system**: `POST /api/leads` endpoint with Mongoose model (`lib/db/src/schema/leads.ts`), Zod validation, rate limiting (5/hr/IP), email notification to sales team, upsert for duplicate emails.
- **Hero email capture**: Landing page hero form fires fire-and-forget `POST /api/leads` with `keepalive: true` before redirecting to `/register`.
- **Calculator email gate**: Commission calculator shows headline results free, gates full breakdown + CTA behind email capture. `POST /api/leads` with `source: 'calculator'` on submit.
- **Careers schedule field**: Added `schedule: "full-time" | "part-time"` to the `Job` interface in `lib/jobs.ts` and display it as a badge on both the careers listing page and job detail page, alongside the existing `type` badge. Also added schedule info to the job card metadata row with a `Clock` icon.
- **Careers page expansion**: Added part-time variant of the Sales Rep job (`slug: "sales-representative-part-time"`, `schedule: "part-time"`) with adjusted description (commission-only side income framing) and offers (flexible hours emphasized). Also renamed full-time title to "SaaS Sales Representative (Commission-Based)" for clarity.
- **AFFiNE agreement fix**: Replaced all instances of "Kyrazo Labs FZCO" / "Kyrazo Labs" with "KYRAZO LLC" in the Sales Representative Agreement document.
- **Careers page header**: Replaced full marketing `Navbar` on `/careers` listing page with a simple clean header (logo + "CommissionKit" wordmark + "Careers" label), matching the style from the job detail page (`careers-job.tsx`).
- **Careers page scroll effect removed**: Removed `useScroll`, `useTransform`, `useIsMobile`, `containerRef`, and the `motion.div` wrapper with animated padding/borderRadius/borderWidth/maxWidth. The page now uses a standard full-height layout: fixed header, scrollable content div (`overflow-y-auto`), and static footer.
- **Setup Checklist & Sample Data PRD**: Full product brief written by @compass — P0 priority to unblock founder-led sales. 3-step guided overlay (Add Reps → Create Plan → Import Deals) + one-click "Load Sample Data" seeding to populate workspace with demo-ready data. Saved at `docs/prd-setup-checklist.md`. Estimated 3-4 days to implement (@forge backend, @pixel frontend).
- **Setup Checklist & Sample Data — IMPLEMENTED**: Backend (`POST/DELETE /api/workspace/sample-data`) + Frontend (`SetupChecklist` overlay, `use-setup-checklist` hook, dashboard integration). 21 new tests (12 backend + 9 frontend), 0 regressions.
- **Workspace onboarding state**: Added database-backed onboarding sub-document to `Workspace` (`onboarding.checklistDismissed`, `checklistCompletedAt`, `checklistShownAt`), new Zod schemas in `@workspace/db`, `PATCH /api/workspaces/:id/onboarding` endpoint, onboarding included in workspace GET/PUT/PATCH responses, and full test coverage in `artifacts/api/src/routes/workspaces/onboarding.test.ts`.
- **Setup Checklist & Sample Data — review fixes**: Fixed React Query invalidation keys in `use-setup-checklist` to use generated keys (`/api/reps`, `/api/plans`, `/api/deals`, `/api/runs`, `/api/dashboard/summary`). Refactored `seedSampleData` to use Mongoose transactions on replica sets with automatic fallback to best-effort cleanup on standalone MongoDB. `workspace.sampleDataLoaded` is now set inside the transaction to bypass rep limits during seeding. API test DB bootstrap updated to `MongoMemoryReplSet` so transaction paths are exercised.
- **Blog multi-language language selector fix**: @forge replaced the React-state-driven `LanguagePills` dropdown with native `<details>`/`<summary>` and anchor tags. Root cause was Next.js hydration failing behind the nginx proxy because internal routes don't include `/blog`; `assetPrefix` only fixes asset URLs, not routing. The native disclosure widget works without JS hydration and keeps public URLs `/blog/${lang}/${slug}`. Typecheck passes; verified through nginx proxy.
- **Blog dynamic language support**: Removed hardcoded `SUPPORTED_LANGUAGES` from `posts.ts`; language list is now derived from actual translation files. Pages no longer 404 for new languages — they try the requested language, fall back to English, then 404 only if English is also missing. Added `es`, `fr`, `de`, `hi` translations for `welcome-to-commissionkit`. Updated `LANGUAGE_LABELS` in `language-pills.tsx`. Updated `posts.test.ts` to assert dynamic behavior. Verified all new language URLs load (`/blog/es|fr|de|hi|pt|ar|en/welcome-to-commissionkit`) and unknown slugs 404. Full monorepo typecheck passes.
- **Blog UI multi-language**: Created `artifacts/blog/src/lib/translations.ts` with full UI translation dictionaries for `en`, `ar`, `es`, `fr`, `de`, `pt`, `hi`. All blog chrome (layout header/footer, index page, article page, fallback banner, blog grid empty state, language pills/filter/switcher/badge) now reads from translations. Dynamic strings use `{placeholder}` templates with format helpers to stay serializable across the Next.js RSC/client boundary. Added `translations.test.ts`. Verified all 7 language index and article pages render translated UI; blog build and full monorepo typecheck pass.
- **Deal creation & optimistic update cache corruption fix (P0)**: Fixed critical React Query cache corruption in deals.tsx — the pagination refactor changed list responses from `Deal[]` to `{ data: Deal[], pagination }` but `CreateDealDialog`, `UpdateDealDialog`, and `DealDeleteAction` optimistic updates still treated the cache as a plain array. This corrupted the cache on every mutation, causing data to disappear and error states to cascade. Also fixed: onError handlers now show actual server error messages instead of hardcoded strings; `console.log` debug line removed.
- **Blog indexation fix (P0)**: Diagnosed and fixed GSC sitemap error causing the blog to be invisible to Google. Root cause: `/blog/sitemap.xml` included `https://commissionkit.co/blog` which is a 307 redirect to `/blog/en`, and the sitemap alternates lacked `x-default` hreflang. Fixed by removing the redirecting root URL from `sitemap.ts`, adding `x-default` to all sitemap alternates, setting `metadataBase` on blog pages (fixing absolute canonical/hreflang/OG URLs), and adding `Sitemap: https://commissionkit.co/blog/sitemap.xml` to the main `robots.txt`. Added `sitemap.test.ts` with 5 assertions. Verified `/blog/sitemap.xml` returns 200 `application/xml` with 21 valid URLs through the nginx proxy.
- **Skill registry migration (P0)**: Deleted all 7 legacy `os/skills/` flat `.md` files. All 16 agent definitions in `.agents/agents/` updated with proper `.agents/skills/` references — each agent now loads 1-3 domain-specific skills from the 27-skill catalog. Documentation updated: `AGENTS.md`, `os/README.md`, `os/STATUS.md`, `context/progress-tracker.md`.
- **Skill catalog expansion**: 15 new skills added via `bunx skills add` — analyze, statistical-analysis, financial-statements, legal-risk-assessment, legal-response, risk-assessment, audit-support, competitive-intelligence, campaign-plan, call-prep, performance-review, ux-copy, canvas-design, algorithmic-art, and prd-writer. All 16 agents updated to include relevant new skills. Total skill catalog: 45+ skills across `.agents/skills/` and `.opencode/skills/`.
- **Careers page trust & conversion overhaul**: Fixed 6 issues identified from rep feedback. Data layer: added `earningsExample`, `leadPromise`, `payoutTimeline` optional fields to `Job` interface. Rewrote both job descriptions (full-time + part-time) — replaced "generate own leads" with "close qualified leads we provide", added payout timeline (15 days, no minimum), added earnings examples ($3K-$8K/mo with concrete deal math). Frontend: added 5 new sections to `careers-job.tsx` (Earnings Potential card, Product Preview with `demo.jpg` screenshot, About CommissionKit founder story, Lead Generation card, Payout Timeline card), updated contractor terms box with commission details. Listing page: added "Why sell CommissionKit" 4-stat banner ($3K-$8K earnings, 10+ leads, 15-day payout, 30%+10% commission) and rewrote hero text for clarity. Follow-up humanization pass: 25 string edits across all 3 files removing em dashes, corporate-speak, promotional language, rule-of-three lists, and filler words. Replaced "premium B2B SaaS platform" with concrete description, "well-funded" with "self-funded", added personality and voice to descriptions, offers, and lead promise. Typecheck passes.
- **Audit Trail — Cross-Team Planning Complete (P1)**: Full-team mobilization coordinated by @nexus. Six specialized plans produced:
  - **@compass** — PRD at `docs/prd-audit-trail.md`: 3-phase rollout (8-10 eng days), tiered retention, RBAC `audit_log:read`, all mutations logged, async writes via BullMQ.
  - **@plan** — Architecture: Mongoose plugin + BullMQ hybrid, AsyncLocalStorage for request context, Better Auth `dash()` projection for auth events, TTL index with S3 archival, 10-day build.
  - **@forge** — Backend: Mongoose `AuditEvent` schema with 8 compound indexes, `auditPlugin` for automatic single-doc CRUD capture, manual `logAudit()` helper for bulk/system events, `GET /api/audit-log` with full filter/pagination, `GET /api/audit-log/export` CSV. Code sketches included.
  - **@pixel** — Frontend: 8 new components (`AuditLogPage`, `AuditLogFilters`, `AuditLogTable`, `AuditLogDiff`, `AuditLogExportDropdown`, `FilterChip`), URL-driven filters, stacked diff display, mobile card layout, 11.5h estimated effort.
  - **@craft** — UX spec: `/dash/audit-log` page at Operations group, `ScrollText` sidebar icon, colored action badges (Plus/Pencil/Trash), expandable rows with stacked before/after diffs, horizontal filter bar with active chips, CSV/PDF export, responsive card layout on mobile, full i18n key map.
  - **@vault** — Infra: ~65K events/day, ~100 GB/year steady-state MongoDB, dedicated `audit-worker` container (256MB, 0.5 vCPU), batch `insertMany` (100/batch, 5s timeout), S3 NDJSON archival with daily cron, `w:1` write concern, ~$1-10/mo incremental cost (varies by provider: Hostinger $1, Hetzner €5-10, R2 free tier for first ~10GB archival).
- **Audit Trail — Phase 1 Implementation (BACKEND COMPLETE)**: @forge built backend MVP: `AuditEvent` schema (`lib/db/src/schema/auditEvents.ts`), `auditPlugin` + dispatcher (`lib/db/src/plugins/audit.ts`, `audit-dispatcher.ts`), queue wiring (`{ck-audit-log}`), `audit-worker.ts`, `GET /api/audit-log` + `GET /api/audit-log/export` + `GET /api/audit-log/:id`, RBAC `audit_log:*`, AsyncLocalStorage request context (`audit-context.ts`), manual `logAudit()` wired into sample-data, deals import, workspace invite/role/delete, billing webhooks, and integration connect/disconnect/sync. 12 new tests pass. Phase 2 frontend work (page, filters, table, diff viewer) is next for @pixel.
- **Blog translations split into section JSON files**: Refactored the 400-line monolithic `translations.ts` into 21 organized source JSON files (7 languages × 3 sections: common, blog, ui) under `artifacts/blog/translations/[lang]/`. Added `scripts/merge-translations.ts` that merges sections into single `src/generated/translations/[lang].json` at build/dev time. The `merge-translations.ts` script is prepended to both `dev` and `build` scripts in `package.json`. `translations.ts` is now a thin wrapper importing generated JSON statically. 28 tests pass, 0 regressions, full typecheck clean.
- **Web i18n translations split into section JSON files**: Split the 3 monolithic locale JSONs (786-1277 lines each) into organized section files under `artifacts/web/translations/[lang]/[section].json` (27-28 sections per language: common, auth, dashboard, deals, etc.). `scripts/split-translations.ts` handled the one-time migration; `scripts/merge-translations.ts` combines sections back into `src/i18n/generated/[lang].json` at build/dev time. Both `dev` and `build` scripts now start with `bun run scripts/merge-translations.ts`. `src/i18n/index.ts` imports from `./generated/` instead of `./locales/`. Full typecheck clean; no regression in non-audit tests.
- **HubSpot Integration blog post**: @ink wrote and published a ~1,630-word blog post announcing the CommissionKit HubSpot connector. Covers: why sync eliminates manual CSV exports, 6-step setup walkthrough (install → authenticate → map owners → configure stages → set sync schedule → enable auto-calculation), ROI math (50-70 hrs/year saved for 20-rep teams, $1,700-$3,100 recovered labor cost), change handling (rep turnover, pipeline redesign, multi-currency), and CTA to connect HubSpot. Written with human-writing principles applied. Published at `artifacts/blog/articles/2026-07-21/hubspot-integration/en.mdx`.
- **Blog cover image fallback**: Updated `posts.ts` cover lookup from hardcoded `cover.png` to fallback chain: `cover.webp` → `cover.png` → `cover.jpg` → `cover.jpeg`. API endpoint (`cover.ts`) already supported all formats.
- **HubSpot blog translations**: Translated the HubSpot Integration article into 6 additional languages (ar, de, es, fr, hi, pt) — 7 languages total, matching existing article structure.
- **Blog lead capture form**: Created `BlogLeadCapture` client component that appears at bottom of every blog article. Posts name + email to `/api/leads` with `source: "blog"`. Fully translated across all 7 languages with idle/loading/success/error states. Added 11 new translation keys per language. Build generates 33 static pages with no regressions.
- **Blog SEO keywords**: Added `keywords` field to `BlogPostMeta` interface and page metadata. Populated SEO keywords (6 per article) across all 21 MDX files (3 articles × 7 languages) with search-relevant terms like "commission management software", "hubspot commission integration", "spreadsheet commission errors".
- **Blog SEO/GEO/Social Cards Audit (P1)**: @nexus conducted full audit of blog metadata layer. Strong foundation confirmed (OpenGraph, Twitter cards, Schema.org JSON-LD, sitemap, hreflang, robots.txt with GEO Content-Signal directives, SSR). 8 issues found, 6 fixed:
  - **P1 Fixed**: Broken `og-default.webp` reference → changed to existing `og.png` in `[lang]/layout.tsx`. Relative OG image URLs on blog index → made absolute in `[lang]/page.tsx`. Article OG image URLs now absolute via `makeAbsolute()` helper in `[lang]/[slug]/page.tsx`. Created missing `/api/og/[slug]/[lang]` API route with per-article OG image support + generic `og.png` fallback. Updated `posts.ts` to always return OG image URL (the API route handles fallback).
  - **P3 Fixed**: Added `viewport` export (`themeColor`, `width`, `initialScale`) to both `layout.tsx` and `[lang]/layout.tsx`. Dynamic `robots.ts` synced with static file (added `meta-externalagent` and `cohere-ai` groups). Twitter share URL updated `twitter.com` → `x.com`.
  - **P3 Known**: `og.png` at 226KB should be optimized to WebP. Static `robots.txt` has `Crawl-delay`/`Content-Signal` headers not supported by Next.js `MetadataRoute.Robots` type — handled by nginx or static file.
  - 28 tests pass, typecheck clean, 0 regressions.
- **Spiffs blog article (SEO-driven)**: @ink wrote a ~1,650-word blog article — "What Is a Spiff in Sales? A Complete Guide to Sales Incentive Funds" — targeting 13 keywords with a combined 39,200 monthly search volume (led by "spiff" at 14,800/mo, "spiffs meaning" group at 17,600/mo, "what is a spiff" at 1,900/mo). Published at `artifacts/blog/articles/2026-07-21/what-is-a-spiff/` with 7 language translations (ar, de, en, es, fr, hi, pt). Article covers: spiff definition, how spiffs work, why companies use them, 5 real-world examples, common pitfalls, tracking strategies, and Salesforce spiffs. Blog build generates 40 static pages (up from 34), 28 tests pass, typecheck clean.
- **Web SSR SEO keywords**: Added keyword research data (34 keywords, ~37K total monthly search volume) to all 7 SSR-prerendered public pages. @lens mapped keywords to pages by search intent; @pixel implemented changes across `entry-server.tsx` (SSR routeMeta) and 6 page files (usePageMeta client-side helmet) for metadata consistency. Key findings: calculator page captures 31K/mo (80% of volume), "commission pay calculator" alone is 8,100/mo. Landing page keywords updated with 8 terms, calculator with 9, features with 8, solutions with 5, pricing with 5. Landing page was missing usePageMeta entirely — now added. Legal pages (privacy/terms/security) left unchanged.
- **Dashboard & Portal UX Overhaul UX Spec**: @craft wrote comprehensive UX design spec at `docs/ux-spec-dashboard-portal-overhaul.md` (1,182 lines). Covers information architecture, component decomposition, visual design direction, stat card redesign, table enhancements, chart improvements, responsive design, empty/loading/error states, admin-vs-rep differentiation, interaction patterns, and mobile adaptations. All CSS classes reference the token system, all patterns follow the Visual Pattern Registry. Includes API change requests for backend and phased implementation timeline (~28 hours estimated).
- **Dashboard & Portal UX Overhaul — Phase 3 Frontend Complete**: @pixel decomposed the 317-line public portal orchestrator into 4 focused components: `PortalAuth` (login form with JWT, password toggle, error states), `PortalChangePassword` (force password change with validation), `PortalDashboard` (main rep view — sortable deal table, Recharts BarChart, StatCards, payout history with dispute), `PortalDisputeDialog` (dispute submission modal). All components use shared components (`StatCard`, `SortableTableHead`, `useTableSort`) built in Phase 1. Full typecheck clean, 23 new tests pass, 0 regressions. Props aligned with orchestrator's API. Backend API additions (`previousPeriod`, `teamRank`, `monthlyTrend`, CSV export) deferred — frontend handles missing data gracefully.
- **Dashboard & Portal UX Overhaul PRD**: @compass wrote comprehensive PRD at `docs/prd-dashboard-portal-ux-overhaul.md`. Covers 5 pages (Dashboard, Admin Rep Portal, Public Rep Portal, Enterprise Projects, Payouts) with specific code-level evidence of problems. 4-phase implementation plan (10-14 eng days). Key decisions: decompose 913-line public portal into 5+ files, add trend indicators to all stat cards, make all tables sortable, differentiate admin vs. rep portal experiences, add mobile-responsive table patterns. P0 features prioritized for immediate impact. Ready for @forge (API additions) and @pixel (frontend implementation).
- **Integration Money Pages — Odoo, HubSpot, Salesforce (SEO Pipeline)**: @nexus coordinated a hub-and-spoke SEO content strategy starting with bottom-of-funnel integration pages. **@pixel** built all three public-facing integration pages:
  - `/integrations/odoo` (397 lines) — 7 sections targeting 7 keywords, connector visual uses `/plugins/odoo.webp` + `/brand/logo-symbol.svg`
  - `/integrations/hubspot` (393 lines) — 7 sections targeting 6 keywords ("hubspot commission integration", "hubspot sales commission software", etc.), aligned with existing HubSpot blog article
  - `/integrations/salesforce` (394 lines) — 7 sections targeting 7 keywords, covers OAuth 2.0 auth, sandbox support, SOQL sync
  - `/integrations/custom` (398 lines) — 7 sections targeting 6 keywords, covers JSONPath mapping, 4 auth methods, 3 pagination strategies, $div compute fields, smart response detection
  - Added "Integrations" hover dropdown to the marketing `Navbar` (Odoo ERP, HubSpot CRM, Salesforce CRM, Custom REST API) with desktop hover + mobile menu support
  - All 4 routes registered in `App.tsx`
  - Improved step number styling across all 4 pages — outlined circles with tabular-nums and gradient connecting lines between steps on desktop
  - **@ink** wrote the middle-of-funnel companion blog article "How to Automate Odoo Commission Calculations (Without Spreadsheets)" (~1,550 words, human-writing style) at `artifacts/blog/articles/2026-07-23/odoo-commission-automation/en.mdx` targeting 6 SEO keywords.
  - Full monorepo typecheck passes (all 5 workspaces). Pipeline: `/integrations/<connector>` (money) → blog article (middle) → ToFu article (pending).
- **Odoo content cluster completed — ToFu + MoFu articles (SEO Pipeline)**: @nexus coordinated completion of the hub-and-spoke content cluster for the Odoo integration. Two new blog articles written by @ink, completing the 4-layer funnel:
  - **ToFu** — "Why Odoo doesn't have commission tracking (and what finance teams actually do)" at `artifacts/blog/articles/2026-07-27/odoo-commission-tracking-gap/en.mdx` (~1,350 words). Targets 6 keywords: `odoo commission tracking`, `odoo sales commission`, `odoo erp commission management`, `odoo sales performance tracking`, `odoo finance automation`, `odoo spreadsheet export commissions`. Problem-awareness piece — acknowledges Odoo's strengths, names the commission gap, describes the real monthly workflow finance teams endure, quantifies costs ($2,500-$3,500/year labor, error rates, rep trust erosion). Links to MoFu comparison article.
  - **MoFu #2** — "Sales commission tracking for Odoo: spreadsheets vs. custom modules vs. dedicated software" at `artifacts/blog/articles/2026-07-27/odoo-commission-options-compared/en.mdx` (~1,450 words). Targets 6 keywords: `odoo commission structure`, `odoo sales commission calculation`, `how to track commissions in odoo`, `odoo commission formula`, `odoo sales rep commission`, `odoo commission management`. Honest three-way comparison with side-by-side table, team-size guidance (1-3 reps: spreadsheets fine; 5-10: pain starts; 15+: breaks), and specific costs ($5K-$15K for custom modules, $200-$500/mo for dedicated software). Links to existing MoFu automation article AND BoFu `/integrations/odoo`.
  - **Full Odoo funnel now complete**: ToFu (problem awareness) → MoFu #2 (options comparison) → MoFu #1 (automation guide, existing) → BoFu (integration page, existing). All articles use human-writing principles (no em dashes, no AI vocabulary, conversational tone, specific numbers). Both new articles are English-only; translations to 6 other languages pending. Blog rebuild required for static prerender.
- **Integration pages BOFU audit & trust overhaul (P0)**: Third-party funnel audit of all 4 integration pages (Odoo, HubSpot, Salesforce, Custom) rated 7/10 structurally but "trust-thin." 6 issues identified and resolved:
  - **P0 bug fix**: HubSpot page stat inconsistency — `$1,700–$3,100/year` corrected to `$1,500–$3,000/month` to match Odoo/Salesforce pages and resolve internal contradiction ("saved per month" label vs "/year" claim).
  - **P0 verified**: FAQ accordion rendering confirmed correct — answers are populated; reviewer saw collapsed accordions.
  - **P0 SEO fix**: HubSpot and Salesforce pages were missing explicit `robots: "index, follow"` in `usePageMeta()` (causing client-side hydration to flip SSR's `index, follow` to default `noindex, nofollow`). Now consistent with Odoo/Custom pages.
  - **P0 SEO fix**: Staging noindex protection — `entry-server.tsx` and `use-page-meta.ts` now gate robots directives on `VITE_STAGING` env var. All 14 routeMeta entries use `ROBOTS_DIRECTIVE` constant. `usePageMeta` downgrades any index directive to noindex on staging. `VITE_STAGING=true` confirmed already set on Coolify staging app (`viermbbtg34icdd3auzqe2dd`).
  - **P1 trust signals (right now)**: Added across all 4 pages: (a) ROI disclaimer with honest sourcing language, (b) "can save" verbage replacing unverifiable "saves" claims, (c) integration-specific technical credibility callouts (Odoo JSON-RPC, HubSpot v3 API, Salesforce SOQL, Custom JSONPath), (d) 2 security FAQ items (TLS 1.3, sync retry behavior), (e) founder transparency block ("self-funded team, no VC pressure").
  - **P1 differentiation**: Added one-sentence category positioning per integration page (why CommissionKit over Xactly/CaptivateIQ/QuotaPath for THIS CRM).
  - **P1 strategy**: @compass delivered trust signal strategy at `docs/integration-trust-strategy.md` — 4-tier milestone plan (logo → quote → result → case study) tied to customer count, per-integration tracking, escalation rules, 6 immediate action items. Total trust signal changes: 16 edits across 4 files, full monorepo typecheck passes.
- **Rep Commission Export (CSV + PDF)**: Added server-side export route `GET /api/reps/:id/export?month=YYYY-MM&format=csv|pdf` — queries CommissionResults by rep+month, includes related Payouts, generates CSV (inline) or PDF (jspdf + jspdf-autotable) with deals table, payouts table, and summary. Frontend `RepExportAction` component added to rep row dropdown menu with MonthPicker dialog and CSV/PDF download buttons. Installed `jspdf@4.2.1` and `jspdf-autotable@5.0.8` in `@workspace/api`. Full monorepo typecheck passes, no new test failures.
- **Audit Log Export (CSV + PDF)**: Overhauled `GET /api/audit-log/export` to accept `month` (YYYY-MM) and `format` (csv|pdf) params. Month param auto-computes startDate/endDate for the calendar month. PDF generation via jspdf + jspdf-autotable with teal-themed table (Timestamp, User, Action, Resource, Name, Changes) and total count. Frontend `AuditLogExportDropdown` rewritten from DropdownMenu to Dialog with MonthPicker, CSV/PDF download buttons, and full blob download flow (replacing "coming soon" placeholder). Preserves existing filter params (search, userId, action, resourceType).
- **Landing page copy credibility fix (P0)**: Replaced fabricated social proof across 3 files after third-party audit identified unverifiable claims and AI-sounding copy. **Hero.tsx**: removed fake star ratings + "Loved by finance & RevOps teams" → "Built for finance & RevOps teams"; removed unverifiable "8 days → 4 hours" stats; replaced trust metrics with honest "What CommissionKit replaces" framing. **SocialProof.tsx**: removed fabricated stats ("99% accuracy", "14 hrs saved/month"); replaced with one-line honest positioning text. **Pricing.tsx**: removed "Limited-Time Launch Offer — 60% Off Forever" urgency language → "Launch pricing for early customers". Human-writing principles applied (no inflated language, no AI vocabulary, no unverifiable claims). Full monorepo typecheck passes.
- **Blog outline button + related articles**: Synced blog's `Button` outline variant with web app's styling (`bg-transparent`, `text-foreground`, `border-input`, `hover:bg-muted`). Added `getRelatedPosts()` function to `posts.ts` — finds articles sharing tags, sorted by shared tag count then date. Created `RelatedArticles` server component rendering up to 3 related article cards below blog content using "Read also" heading. Added `readAlso` translation key to all 7 languages. Blog build passes at 61 static pages; full monorepo typecheck clean.
- **Blog Umami analytics + funnel CTA**: Added Umami script (`a.commissionkit.co`, website ID `69d72e35`) to blog's `[lang]/layout.tsx` — now all blog page views and events are captured. Created `lib/analytics.ts` with Umami event wrapper. Created `FunnelCTA` component replacing generic `BlogLeadCapture` — tag-aware, detects funnel stage (ToFu/MoFu#2/MoFu#1 for Odoo articles via tags), renders contextual CTA card pushing readers to the next funnel stage. Dynamic event names: `{funnel}_{stage}_cta_view` and `{funnel}_{stage}_cta_click` (e.g. `odoo_tofu_cta_click`, `odoo_mofu1_cta_click`) — directly usable as Umami funnel step Event filters. Non-funnel articles get a redesigned email capture CTA. Blog build: 61 static pages, 0 regressions.
- **Integration page trial click tracking**: Added `Analytics.integrationTrialClick(provider, location)` to web analytics. Wired `onClick` handlers into all 8 "Start Free Trial" buttons across 4 integration pages (odoo/hubspot/salesforce/custom × hero/bottom). Each fires `integration_trial_click` with `{ provider, location }` — enables per-integration funnel tracking.

- **Mobile responsive layout pass (P1)**: Made all app pages mobile-friendly across dashboard, settings, commission, team, payouts, disputes, and reports. Applied mobile-first responsive patterns: stat card grids changed from fixed columns to `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`; table-heavy pages wrapped `<Table>` in `overflow-x-auto` divs; flex rows with `items-center justify-between` changed to `flex-col sm:flex-row sm:items-center sm:justify-between gap-4` for vertical stacking on mobile. Files edited: `dashboard.tsx` (stat cards), `reports.tsx` (skeleton grids), `runs.tsx` (table overflow), `deals.tsx` (table overflow), `run-details.tsx` (table overflow), `reps.tsx` (table overflow), `payouts.tsx` (table overflow), `disputes.tsx` (resolved table overflow), `settings.tsx` (6 flex patterns + 1 grid), `settings-roles.tsx` (2 grids), `billing.tsx` (1 grid + 7 flex patterns). Full monorepo typecheck passes.

- **Odoo content cluster completed — ToFu + MoFu articles (SEO Pipeline)**: @nexus coordinated completion of the hub-and-spoke content cluster for the Odoo integration. Two new blog articles written by @ink, completing the 4-layer funnel:
  - **ToFu** — "Why Odoo doesn't have commission tracking (and what finance teams actually do)" at `artifacts/blog/articles/2026-07-27/odoo-commission-tracking-gap/en.mdx` (~1,350 words). Targets 6 keywords: `odoo commission tracking`, `odoo sales commission`, `odoo erp commission management`, `odoo sales performance tracking`, `odoo finance automation`, `odoo spreadsheet export commissions`. Problem-awareness piece — acknowledges Odoo's strengths, names the commission gap, describes the real monthly workflow finance teams endure, quantifies costs ($2,500-$3,500/year labor, error rates, rep trust erosion). Links to MoFu comparison article.
  - **MoFu #2** — "Sales commission tracking for Odoo: spreadsheets vs. custom modules vs. dedicated software" at `artifacts/blog/articles/2026-07-27/odoo-commission-options-compared/en.mdx` (~1,450 words). Targets 6 keywords: `odoo commission structure`, `odoo sales commission calculation`, `how to track commissions in odoo`, `odoo commission formula`, `odoo sales rep commission`, `odoo commission management`. Honest three-way comparison with side-by-side table, team-size guidance (1-3 reps: spreadsheets fine; 5-10: pain starts; 15+: breaks), and specific costs ($5K-$15K for custom modules, $200-$500/mo for dedicated software). Links to existing MoFu automation article AND BoFu `/integrations/odoo`.
  - **Full Odoo funnel now complete**: ToFu (problem awareness) → MoFu #2 (options comparison) → MoFu #1 (automation guide, existing) → BoFu (integration page, existing). All articles use human-writing principles (no em dashes, no AI vocabulary, conversational tone, specific numbers). Both new articles are English-only; translations to 6 other languages pending. Blog rebuild required for static prerender.
- **Quick Summary blocks added to all blog articles**: @ink added **Quick Summary** sections (300-500 chars) to all 29 existing MDX files across 5 articles and 7 languages (ar, de, en, es, fr, hi, pt). Summaries appear at the top of each article body under the title, giving readers a fast overview before scrolling. The two new Odoo articles (2026-07-27) also received summaries. All 31 blog article files now have in-body Quick Summary blocks. Format: `**Quick Summary:** [text]` followed by `---` horizontal rule.
- **Blog MDX table rendering fixed (P0)**: Tables in blog articles (e.g., the options comparison table in the new Odoo MoFu article) rendered as plain text with literal pipe characters instead of HTML tables. Root cause: `remark-gfm` (GitHub Flavored Markdown plugin) was not installed or configured. Fix: installed `remark-gfm@4.0.1` in `@workspace/blog`, added import to `page.tsx`, and passed `options={{ remarkPlugins: [remarkGfm] }}` to `<MDXRemote>`. Existing `.blog-content table/th/td` CSS classes in `globals.css` were already in place and now apply automatically. No visual regressions — only net-new table rendering. Blog rebuild required to verify.
- **Rep Portal landing page (`/portal`)**: New public SEO-optimized page promoting the Rep Portal as a competitive differentiator. **@lens** delivered keyword research (18 terms, 5 AI SEO terms, competitive gap analysis showing no competitor has a dedicated portal landing page). **@ink** wrote copy targeting the "stop answering what's my commission?" pain point. **@pixel** built the full page (699 lines): hero with stat cards, live demo dashboard (embedded `DemoDashboard` with sample data for "Sarah Chen"), 3-step "How It Works", 5 benefit items, device compatibility card, 5-item FAQ accordion, and bottom CTA. Navbar updated with "Rep Portal" link in Product dropdown (Platform column) and mobile menu. Full SSR prerender configured with `routeMeta` (title, description, keywords, canonical). Route `/portal` registered in `App.tsx` before `/portal/:accessCode` for correct Wouter matching. `artifacts/web/public/screenshots/` directory created for image placeholder. Full monorepo typecheck passes, web build verifies SSR prerender of `https://commissionkit.co/portal`.
|- **Sitemap overhaul (P0)**: Two sitemap issues fixed:
  - **Blog sitemap binary data**: `/blog/sitemap.xml` on production was returning raw binary/garbled data (Next.js live `MetadataRoute.Sitemap` route + nginx Content-Type/gzip mismatch → Google couldn't parse it → blog posts not indexing via sitemap). Fixed by switching to build-time static XML generation matching the web frontend's pattern. Created `scripts/generate-blog-sitemap.ts` (mirrors old `sitemap.ts` logic — same 56 URLs, 448 hreflang alternates, languages, priorities, x-default). Deleted live `src/app/sitemap.ts` and `src/app/sitemap.test.ts`. Script runs after `next build`, produces plain ASCII `public/sitemap.xml`. File correctly identified as "XML Sitemap document, ASCII text" (no gzip, no binary garbage).
  - **Root sitemap as index**: `/sitemap.xml` was a flat `<urlset>` with only 16 marketing page URLs — no path for crawlers to discover the blog sitemap. Rewrote `artifacts/web/scripts/generate-sitemap.ts` to produce two files: `public/sitemap.xml` (now a `<sitemapindex>` with 2 entries: `/sitemap-pages.xml` and `/blog/sitemap.xml`) and `public/sitemap-pages.xml` (the 16 marketing page URLs). Crawlers can now reach the blog sitemap via the root sitemap index. `robots.txt` already lists both sitemap URLs. Both web and blog builds pass clean.

## Where to Go Next
- Back to entry point: `AGENTS.md`
- Related business context: `os/STATUS.md`
