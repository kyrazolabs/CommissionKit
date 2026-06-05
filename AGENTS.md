# AGENTS.md

## Monorepo structure

- **Bun** is the only package manager and runtime. Use `bun` for everything.
- Workspace naming: `@workspace/api`, `@workspace/web`, `@workspace/db`, etc.
- Applications live in `artifacts/`, shared libraries in `lib/`, scripts in `scripts/`.

## Dev commands

```bash
# API server (port 8088) + BullMQ workers
bun run --filter @workspace/api dev

# Web frontend (port 3000)
bun run --filter @workspace/web dev

# Regenerate API client types, Zod schemas, and React Query hooks from OpenAPI spec
bun run --filter @workspace/api-spec codegen

# Full build (typecheck first, then build all workspaces)
bun run build

# Typecheck only (two-phase: tsc --build on libs, then tsc --noEmit on apps/scripts)
bun run typecheck
```

### Testing

```bash
# Run all tests across the monorepo
bun test

# Run tests for a specific workspace
bun test --filter @workspace/db
bun test --filter @workspace/api
bun test --filter @workspace/web
bun test --filter @workspace/queue

# Run a single test file
bun test artifacts/api/src/routes/reps.test.ts

# Run tests with watch mode (re-run on file changes)
bun test --watch

# Run tests with coverage (built into Bun)
bun test --coverage

# Run tests matching a pattern
bun test --test-name-pattern "calc-engine"
```

## Local prerequisites

- **MongoDB** and **Redis** must be running. Defaults: `mongodb://localhost:27017/commissionkit`, `redis://localhost:6379`.
- Spin up both via Docker: `docker compose -f infra/database.docker-compose.yml up -d` (Mongo 7.0 + Redis 7 alpine).
- Copy `.env.example` to `.env` in both `artifacts/api/` and `artifacts/web/`.

## Environment variables

- Env files are **per-application** (`artifacts/api/.env`, `artifacts/web/.env`), not at the repo root.
- API requires: `MONGO_URL`, `REDIS_URL`, `SESSION_SECRET`, `BETTER_AUTH_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, Stripe price IDs, SMTP credentials, S3 credentials (for log uploads).

## Architecture notes

- **Backend**: Express 5 with Mongoose/MongoDB. Entry: `artifacts/api/src/index.ts`.
- **Frontend**: React 19 + Vite 7 + Tailwind CSS 4 + shadcn/ui (Radix). Router is **Wouter** (not React Router). Data fetching uses TanStack React Query with auto-generated hooks from `@workspace/api-client-react`. Entry: `artifacts/web/src/main.tsx`.
- **Auth**: Better Auth integrated into Express 5. MCP server available at `https://mcp.better-auth.com/mcp` (see `.agents/mcp.json`).
- **Email queue**: 3 priority tiers (high/medium/low) → SMTP execution queue at 10/sec, concurrency 2. Powered by BullMQ + Redis. Queue prefix: `"ck"`.
- **Database**: Mongoose (primary) + Drizzle Kit for migrations. Connection logic in `@workspace/db`.
- **Shared validation**: Zod schemas in `@workspace/api-zod`, consumed by both API and web.

## TypeScript conventions

- Root `tsconfig.json` uses **project references** for `lib/db`, `lib/api-zod`, and `lib/api-client-react` (composite builds with `emitDeclarationOnly`).
- Lib packages emit declarations to `dist/`; apps run `tsc --noEmit`.
- Zeroconfig: `tsconfig.base.json` sets `moduleResolution: "bundler"`, `target: "es2022"`, `strictNullChecks: true`, `noUnusedLocals: false`.

## Testing

**Bun's built-in test runner** is the only test framework. No Vitest, Jest, or Mocha.
Test files use the `.test.ts` (or `.test.tsx`) extension, placed adjacent to source files.
Bun auto-discovers `*.test.*` files — no configuration needed beyond what's described here.

### Test infrastructure

- **MongoDB**: Use `mongodb-memory-server` for isolated in-memory test databases. Never use a real/shared MongoDB database. Set `MONGO_URL` to the memory server URI before importing any database-dependent code.
- **Redis**: Use `ioredis-mock` to simulate Redis in tests. No real Redis instance needed during test runs. The `@workspace/queue` connection module reads `REDIS_URL`, so set it to `"redis-mock://"` to trigger mock mode.
- **Express app**: Import the Express app from `artifacts/api/src/app.ts` directly (not `index.ts` — which starts workers and schedules jobs). Use `supertest` to make HTTP assertions without binding to a real port.
- **Better Auth**: Auth is mounted at `/api/auth/*`. Use the auth client's `auth.api` methods for user sign-up/sign-in in test setup. Call `auth.api.signUpEmail()` and `auth.api.signInEmail()` with the same headers that `supertest` would pass.
- **BullMQ**: When `REDIS_URL` is set to the mock, BullMQ workers will use the mock Redis. Disable worker auto-start in tests (`workers` array not registered) to prevent side-effects. Test queue enqueuing/dequeuing behavior directly against the mock Redis.
- **Stripe**: Always mock Stripe. Either stub `stripe` module methods with `mock.module` or use `nock` to intercept Stripe HTTP calls. Never call the real Stripe API in tests.
- **SMTP**: Mock nodemailer's `createTransport`. The `@workspace/queue/mailer` module exports the transport — mock `sendMail` to resolve successfully.
- **S3/Sentry**: Always mock. Sentry can be disabled by not importing `./instrument` and setting `SENTRY_ENABLED=false`-like conditions.

### Test file conventions

```
lib/db/src/schema/reps.test.ts          # Tests Rep model + insertRepSchema Zod schema
lib/db/src/limits.test.ts               # Tests PLAN_LIMITS and getPlanLimits()
lib/queue/src/worker.test.ts            # Tests email queue routing + worker logic
lib/queue/src/enqueue.test.ts           # Tests enqueueEmail, priority routing
lib/email-templates/src/welcome.test.ts # Tests template HTML output
artifacts/api/src/routes/reps.test.ts   # Tests GET/POST/PATCH/DELETE /api/reps
artifacts/api/src/routes/health.test.ts # Tests GET /api/healthz
artifacts/api/src/middleware/auth.test.ts # Tests requireAuth, requireWorkspaceMember, requirePermission
artifacts/api/src/lib/rbac.test.ts      # Tests RBAC permission resolution and caching
artifacts/api/src/lib/limits.test.ts    # Tests checkLimits against subscription state
artifacts/api/src/workers/engines/standard.engine.test.ts  # Tests flat/tiered/accelerator calc
artifacts/api/src/workers/engines/aissol.engine.test.ts    # Tests Aissol matrix calc
artifacts/web/src/components/ui/button.test.tsx            # Tests button variants, click handlers
artifacts/web/src/hooks/use-auth.test.tsx                  # Tests auth provider context
artifacts/web/src/pages/dashboard.test.tsx                 # Tests dashboard page rendering
```

### Test setup helpers

Create a shared test helper module (e.g., `test/setup.ts` at repo root or per-workspace) that exports:

- **`setupTestDB()`** — Starts `mongodb-memory-server`, connects Mongoose, returns the connection and URI. Call in `beforeAll`/`beforeEach`.
- **`teardownTestDB()`** — Drops all collections, disconnects Mongoose, stops memory server. Call in `afterAll`/`afterEach`.
- **`createTestWorkspace(overrides?)`** — Creates a Workspace + WorkspaceMember with owner role. Returns `{ workspace, member }`.
- **`createTestRep(workspaceId, overrides?)`** — Creates a Rep with default test data. Returns the rep document.
- **`createTestPlan(workspaceId, overrides?)`** — Creates a Plan with tiers.
- **`createTestDeal(workspaceId, repId, overrides?)`** — Creates a Deal.
- **`createTestUser(email, password)`** — Creates a Better Auth user via `auth.api` and returns session.
- **`authenticatedRequest(app, session)`** — Returns a `supertest` agent with session cookies and `X-Workspace-ID` header preset. Signature: `request(app).get(...).set('Cookie', cookie).set('X-Workspace-ID', wsId)`.

### Mocking patterns

Bun's built-in mocking: use `mock.module` for module-level mocks and `mock` for function spies.

```ts
// Mock an entire module
mock.module("@workspace/queue", () => ({
  sendMediumPriorityEmail: mock(() => Promise.resolve()),
  enqueueCommissionCalc: mock(() => Promise.resolve()),
}));

// Mock Stripe
mock.module("stripe", () => {
  const create = mock(() => Promise.resolve({ id: "sub_123", status: "active" }));
  return {
    default: mock(() => ({ subscriptions: { create } })),
  };
});

// Spy on a function and restore after
import { describe, test, expect, mock, spyOn } from "bun:test";
const spy = spyOn(console, "error");
expect(spy).toHaveBeenCalledTimes(0);
spy.mockRestore();
```

### What to test (priorities)

**Highest priority** — business logic with zero external dependencies:
1. **`lib/db/src/limits.ts`** — `getPlanLimits()` returns correct limits for every plan type.
2. **`artifacts/api/src/workers/engines/standard.engine.ts`** — Flat rate, tiered splits, accelerators, multi-currency conversion. Every formula variant must be tested with known inputs/outputs.
3. **`artifacts/api/src/workers/engines/aissol.engine.ts`** — Matrix lookup (slabs + GM brackets), invoice commission calculations.
4. **`artifacts/api/src/lib/rbac.ts`** — Permission resolution (owner=all, role permissions, wildcard matching, Redis caching with TTL).
5. **`artifacts/api/src/lib/exchange.ts`** — Currency conversion math, rate fetching, edge cases (zero, negative, missing rates).

**High priority** — API integration tests:
6. **`artifacts/api/src/routes/reps.ts`** — CRUD + bulk import + portal access code generation.
7. **`artifacts/api/src/routes/plans.ts`** — CRUD plans with tiers, validation.
8. **`artifacts/api/src/routes/deals.ts`** — CRUD deals + bulk CSV import + export.
9. **`artifacts/api/src/routes/runs.ts`** — Commission run creation + calculation enqueuing.
10. **`artifacts/api/src/routes/payouts.ts`** — Payout lifecycle (pending → approved → paid).
11. **`artifacts/api/src/routes/disputes.ts`** — Dispute creation, review, resolution.
12. **`artifacts/api/src/routes/portal.ts`** — JWT-based rep portal auth, login, password change.

**High priority** — middleware/auth:
13. **`artifacts/api/src/middleware/auth.ts`** — `requireAuth` rejects missing/invalid sessions; `requireWorkspaceMember` rejects non-members and low-role users; `requirePermission` checks RBAC; auto-accept pending invites.

**Medium priority** — queue infrastructure:
14. **`lib/queue/src/enqueue.ts`** — Job creation with correct priority, deduplication IDs, schemas.
15. **`lib/queue/src/mailer.ts`** — SMTP transport send, `verifySmtp` behavior.
16. **`lib/queue/src/worker.ts`** — Email routing (high/medium/low → send queue → SMTP).

**Medium priority** — web components:
17. **`artifacts/web/src/hooks/use-auth.tsx`** — AuthProvider context values, loading state.
18. **`artifacts/web/src/hooks/use-workspace.tsx`** — Workspace switching, localStorage persistence.
19. **`artifacts/web/src/lib/api.ts`** — `apiFetch` adds correct headers (Auth, X-Workspace-ID), handles errors.
20. **`artifacts/web/src/components/ui/`** — shadcn/ui variant rendering, forward refs, event handlers.

**Medium priority** — email templates:
21. **`lib/email-templates/src/*.ts`** — Each template function returns valid HTML containing expected strings (rep name, workspace name, links, etc.).

**Lower priority** — direct model tests:
22. **`lib/db/src/schema/`** — Zod insert schemas reject invalid shapes, accept valid ones. Mongoose model validation for required fields.
23. **`lib/api-zod/src/generated/api.ts`** — Verify generated Zod schemas match known-good request/response shapes (snapshot tests).

### Writing tests — patterns

**Pure logic tests** (calc engine, RBAC, limits, exchange):
```ts
import { describe, test, expect } from "bun:test";

describe("StandardEngine", () => {
  test("flat rate: $1000 deal at 5% = $50 commission", () => {
    // Arrange — construct input
    // Act — call function
    // Assert — expect exact output
  });

  test("tiered: $10,000 deal with tiers [0-5k:5%, 5k-10k:7%] = $500", () => {
    // ...
  });
});
```

**API route tests** (with supertest + test DB):
```ts
import { describe, test, expect, beforeAll, afterAll, beforeEach } from "bun:test";
import request from "supertest";
import app from "../src/app";

describe("GET /api/reps", () => {
  let workspace: any;

  beforeAll(async () => {
    await setupTestDB();
    workspace = await createTestWorkspace();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  test("returns 401 without auth", async () => {
    const res = await request(app).get("/api/reps");
    expect(res.status).toBe(401);
  });

  test("returns reps list for authenticated workspace member", async () => {
    const session = await createSession(workspace.owner);
    const res = await authenticatedRequest(app, session)
      .get("/api/reps")
      .set("X-Workspace-ID", workspace._id.toString());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
```

**Middleware tests** (unit-test middleware directly):
```ts
import { requireAuth } from "../src/middleware/auth";

test("requireAuth returns 401 when no session", async () => {
  const req = { headers: {} } as any;
  let status = 0;
  const res = { status: (s: number) => { status = s; return { json: () => {} }; } } as any;
  const next = () => {};
  await requireAuth(req, res, next);
  expect(status).toBe(401);
});
```

**React component tests** (with React Testing Library):
```tsx
import { describe, test, expect } from "bun:test";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "../src/components/ui/button";

test("Button renders children and handles click", async () => {
  let clicked = false;
  render(<Button onClick={() => { clicked = true; }}>Click Me</Button>);
  await userEvent.click(screen.getByText("Click Me"));
  expect(clicked).toBe(true);
});
```

**Email template tests** (pure output assertions):
```ts
import { describe, test, expect } from "bun:test";
import { repPortalTemplate } from "@workspace/email-templates";

test("rep portal email contains rep name and portal link", () => {
  const html = repPortalTemplate({
    repName: "Alice",
    workspaceName: "Acme Corp",
    portalUrl: "https://app.example.com/portal/abc123",
    portalUsername: "alice123",
    portalPassword: "temp-pass",
  });
  expect(html).toContain("Alice");
  expect(html).toContain("Acme Corp");
  expect(html).toContain("https://app.example.com/portal/abc123");
  expect(html).toContain("alice123");
});
```

### Test isolation rules

- **Every test file** creates its own in-memory MongoDB. No shared state between test files.
- **`beforeEach`** clears collections (or use fresh DB per test file) to prevent test order dependencies.
- **Never import `artifacts/api/src/index.ts`** in tests — it starts servers and workers. Import `app.ts` for Express tests and import modules directly for unit tests.
- **Never import `dotenv/config`** in test files. Set environment variables in test setup or use `process.env.* = ...` assignments before imports.
- **Mock all external services** (Stripe, SMTP, S3, Sentry, Google OAuth). The `mock.module` calls must appear before the module is imported — use `beforeAll` with dynamic imports or top-level mocks.
- **Clean up Redis mock** between tests to prevent job ID collisions and queue state leaks.

## Design conventions

- **No emojis in UI.** Use Lucide icons exclusively (stroke width 2px, sizes 14-16px for dense UI).
- Font: `Inter`. Financial data must use `tabular-nums` for column alignment.
- Accent color: Teal-600 (`174 72% 35%` light / `174 60% 48%` dark).
- Radius: `10px` base, `14px` (`rounded-xl`) for cards/buttons.
- Light + dark mode via `.dark` class on `<html>`.

## Deployment

- Coolify-managed via `docker-compose.yml` (api + web) and `infra/database.docker-compose.yml` (Mongo + Redis).
- API Dockerfile uses `oven/bun:1.3.13-alpine` single-stage.
- Web Dockerfile builds with Bun, serves via Nginx Alpine with SSR prerendered SEO pages.

## Additional context

- `.agents/` contains design philosophy, and platform overview.
- `docs/` has enterprise engine architecture docs.
- `crm/` has sales playbook and CRM platform docs.
- No GitHub Actions CI is configured.
