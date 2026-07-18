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
| Payout architecture research | ✅ Done | AFFiNE OS — `https://affine.commissionk.it`. |
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

- **OS migration to AFFiNE**: All company documentation (identity, strategy, revenue, product, operations, people, customer, tools, governance) migrated from `os/` numbered folders to AFFiNE at `https://affine.commissionk.it`. Numbered folders deleted from repo.
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
- **Blog indexation fix (P0)**: Diagnosed and fixed GSC sitemap error causing the blog to be invisible to Google. Root cause: `/blog/sitemap.xml` included `https://commissionk.it/blog` which is a 307 redirect to `/blog/en`, and the sitemap alternates lacked `x-default` hreflang. Fixed by removing the redirecting root URL from `sitemap.ts`, adding `x-default` to all sitemap alternates, setting `metadataBase` on blog pages (fixing absolute canonical/hreflang/OG URLs), and adding `Sitemap: https://commissionk.it/blog/sitemap.xml` to the main `robots.txt`. Added `sitemap.test.ts` with 5 assertions. Verified `/blog/sitemap.xml` returns 200 `application/xml` with 21 valid URLs through the nginx proxy.
- **Skill registry migration (P0)**: Deleted all 7 legacy `os/skills/` flat `.md` files. All 16 agent definitions in `.agents/agents/` updated with proper `.agents/skills/` references — each agent now loads 1-3 domain-specific skills from the 27-skill catalog. Documentation updated: `AGENTS.md`, `os/README.md`, `os/STATUS.md`, `context/progress-tracker.md`.
- **Skill catalog expansion**: 15 new skills added via `bunx skills add` — analyze, statistical-analysis, financial-statements, legal-risk-assessment, legal-response, risk-assessment, audit-support, competitive-intelligence, campaign-plan, call-prep, performance-review, ux-copy, canvas-design, algorithmic-art, and prd-writer. All 16 agents updated to include relevant new skills. Total skill catalog: 45+ skills across `.agents/skills/` and `.opencode/skills/`.

---
## Where to Go Next

- Back to entry point: `AGENTS.md`
- Related business context: `os/STATUS.md`
