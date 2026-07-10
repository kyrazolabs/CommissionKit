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
| Agent definitions | ✅ Done | 14 agents across 4 teams + Nexus leader. |
| Skill registry | ✅ Done | 12 skills: 5 technical (.opencode/skills/) + 7 business (os/skills/). All assigned to agents. |
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

The following are potential areas for improvement or further verification:

| Area | Suggested Action |
|------|------------------|
| Web component coverage | Add tests for tables, forms, dialogs, cards. |
| E2E tests | No Playwright/Cypress detected; consider adding. |
| CI/CD | No GitHub Actions configured; could add lint/test/build workflow. |
| Payout providers | Research is documented; actual provider integrations not yet wired. |
| Mobile layout polish | Verify all complex tables on small screens. |
| Accessibility audit | Run automated a11y checks on key flows. |
| Performance | Audit bundle size and query cache settings. |
| Email deliverability | Verify SPF/DKIM/DMARC for production SMTP. |

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
- **AFFiNE agreement fix**: Replaced all instances of "Kyrazo Labs FZCO" / "Kyrazo Labs" with "KYRAZO LLC" in the Sales Representative Agreement document.

---
## Where to Go Next

- Back to entry point: `AGENTS.md`
- Related business context: `os/STATUS.md`
