# Code Standards — CommissionKit

## General

- **Language**: TypeScript everywhere.
- **Runtime / Package Manager**: Bun only. Do not use npm, yarn, or pnpm.
- **Formatting & Linting**: Biome (see `biome.json` at repo root). Run `bun run lint` (check) and `bun run lint:fix` / `bun run format` (fix). `bun run build` runs `biome check` before typecheck. Prettier is retained only as an Orval codegen peer dependency, not the source formatter.
- **Testing**: Bun's built-in test runner only. No Jest/Vitest/Mocha.
- **Linting rules**: `noConsole` is an error in production source (`console.log` is forbidden — use Pino `logger` or `console.info`/`warn`/`error`). `noExplicitAny`, `noUnusedVariables`, `noUnusedImports`, and accessibility rules are `warn`-level. TypeScript strictness: `strictNullChecks: true`, `noImplicitAny: true`.

## Monorepo Conventions

- Workspace naming: `@workspace/<name>` (e.g., `@workspace/api`, `@workspace/web`).
- Applications: `artifacts/<name>`.
- Shared libraries: `lib/<name>`.
- Plugins: `plugins/<name>`.
- Scripts: `scripts/`.

## TypeScript

### tsconfig

- Root `tsconfig.json` uses project references for libs.
- Libs emit declarations to `dist/` (`emitDeclarationOnly`).
- Apps/scripts run `tsc --noEmit`.
- `moduleResolution`: `bundler`.
- `target`: `es2022`.
- `strictNullChecks`: `true`.
- `noUnusedLocals`: `false`.

### Imports

- Use explicit `.js` extensions when importing within `@workspace/queue` source files (Bun ESM compatibility).
- Elsewhere, use bare/module imports.
- Use workspace aliases (`@workspace/db`, `@/components/ui/button`) over relative paths when available.

### Types

- Prefer `interface` for public shapes.
- Use `type` for unions, mapped types, and aliases.
- Avoid `any`; use `unknown` when type is genuinely unknown.
- Cast minimally; prefer narrowing.

## Backend Standards (`artifacts/api`)

### Route Structure

- Each domain has a folder: `src/routes/<domain>/routes.ts`.
- Routes are mounted in `src/routes/index.ts`.
- Use `requireAuth`, `requireWorkspaceMember`, or `requirePermission` middleware arrays spread into route definitions.

```ts
router.get("/reps", ...requireWorkspaceMember("member"), async (req, res) => { ... });
router.post("/reps", ...requirePermission("reps", "create"), async (req, res) => { ... });
```

### Request / Response

- Validate request bodies with Zod schemas from `@workspace/api-zod`.
- Return consistent error shapes: `{ error: string, message?: string, details?: any }`.
- Use `400` for validation errors, `401` for auth, `403` for permission, `404` for not found, `500` for unexpected.

### Controllers

- Keep route handlers focused; delegate business logic to `src/lib/` or workers.
- Use `AuthenticatedRequest` type for authenticated routes.
- Read workspace ID from `req.headers["x-workspace-id"]` or `req.workspaceId` after middleware.

### Database

- Use Mongoose models from `@workspace/db`.
- Convert string IDs to `Types.ObjectId` when querying.
- Prefer explicit queries over dynamic `any` model methods.

### Logging

- Use Pino logger (`src/lib/logger`) for structured logs.
- Do not use `console.log` in production code except in worker startup logs.
- Never log secrets, passwords, or full Stripe webhook payloads.

### Errors

- Let unexpected errors bubble to the global error handler in `app.ts`.
- For async handlers, use `try/catch` and pass to `next(err)` or respond directly.

### Workers

- Workers are imported in `src/index.ts` after DB connection.
- Implement graceful shutdown in `SIGTERM`/`SIGINT` handlers.
- Keep workers idempotent where possible.

## Frontend Standards (`artifacts/web`)

### Component Style

- Functional components with hooks.
- Use `React.forwardRef` for reusable UI primitives.
- Props interfaces named `*Props`.
- Default exports for pages; named exports for reusable components.

### Styling

- Tailwind CSS utility classes.
- Use CSS variables for theme colors.
- Use `cn()` for conditional class merging.
- Avoid arbitrary values unless necessary.

### API Calls

- Use auto-generated React Query hooks from `@workspace/api-client-react` for standard CRUD.
- Use `apiFetch` / `paginatedFetch` from `@/lib/api` for custom endpoints.
- Always include `credentials: "include"` for cookie-based auth.
- Workspace ID is automatically added via `localStorage.getItem("ck_active_workspace")`.

### State

- Server state: TanStack React Query.
- Global client state: Zustand (`useSyncStore`).
- Local component state: `useState` / `useReducer`.
- Avoid prop drilling; use context when multiple levels need data.

### Forms

- React Hook Form + Zod resolvers.
- Use `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage` from `@/components/ui/form`.

### i18n

- Use `useTranslation()` hook.
- Translation keys are organized by feature (e.g., `t("sidebar.workspaces")`).
- Load saved language from server on login (`loadSavedLang`).

### Testing

- Test files: `*.test.ts` / `*.test.tsx` adjacent to source.
- API tests use `supertest` + `mongodb-memory-server`.
- Web tests use `happy-dom` (preloaded via `test/dom-setup.ts`).
- React component tests use `@testing-library/react` + `@testing-library/user-event`.
- Mock external services (Stripe, SMTP, S3, Sentry, Redis, Better Auth).

## Shared Library Standards

### `@workspace/db`

- Define Mongoose schemas + Zod insert schemas in the same file.
- Export models and types from `src/schema/index.ts`.
- AISSOL schemas isolated in `src/schema/aissol/index.ts`.

### `@workspace/queue`

- Use `.js` extensions on internal imports.
- Queue names in `src/constants.ts`.
- Job schemas in `src/schemas.ts` (Zod).
- Export convenience wrappers from `src/enqueue.ts`.

### `@workspace/email-templates`

- Pure functions returning HTML strings.
- No React runtime dependency.
- Tests verify expected substrings in output.

### `@workspace/api-zod`

- Generated file: `src/generated/api.ts`.
- Do not hand-edit generated code; regenerate via `bun run --filter @workspace/api-spec codegen`.

### `@workspace/api-client-react`

- Generated React Query hooks + types.
- `custom-fetch.ts` configures base URL, workspace ID, and auth token getter.

## MCP Server Standards (`artifacts/api/src/routes/mcp/`)

- **All constrained fields must use `z.enum()`** — never `z.string()`. AI assistants see dropdown-style allowed values.
- **Every tool must have a permission guard** — `read:<resource>` for reads, `write:<resource>` for mutations. Throw via `requirePermission(ctx, permission, toolName)`.
- **Audit context is set automatically** in `index.ts` via `auditContext.run()`. Tools do not need to call `setAuditUser` — the AsyncLocalStorage wraps every request.
- **Creator info resolved once per session** in `auth.ts` (`createdBy` → Better Auth `user` collection). Stored in `sessionContexts` Map for re-use on subsequent requests.
- **Tool naming**: `<verb>_<resource>` (e.g., `list_deals`, `create_rep`).
- New tools go in a `.tool.ts` file under `src/routes/mcp/tools/` and register via the singleton pattern in `index.ts`.
- File structure mirrors the domain model — one tool file per resource type.

## Plugin Standards (`plugins/`)

- Implement `CKitPlugin` interface from `@workspace/plugins-core`.
- Plugins register in `artifacts/api/src/index.ts`.
- Each plugin handles: connection test, init, destroy, sync reps, sync deals, webhook ingress, egress.
- Normalize data to `NormalizedRep` / `NormalizedDeal`.

## Testing Standards

### Test Isolation

- Each test file creates its own in-memory MongoDB instance via `setupTestDB()` / `teardownTestDB()`.
- Clean collections between tests with `clearCollections()`.
- Use `ioredis-mock` for Redis tests (`REDIS_URL=redis-mock://`).

### Mocking

- Bun `mock.module` for module-level mocks.
- Bun `mock` / `spyOn` for function spies.
- Mock Stripe, SMTP, S3, Sentry, Google OAuth.

### Test Factories

Inline per test file or shared helpers:

- `createTestWorkspace()`
- `createTestRep(workspaceId)`
- `createTestPlan(workspaceId)`
- `createTestDeal(workspaceId, repId)`
- `createTestUser(email, password)`
- `authenticatedRequest(app, session)`

### What to Test

1. Business logic: calc engines, RBAC, limits, exchange.
2. API routes: auth, CRUD, bulk operations, validation.
3. Middleware: requireAuth, workspace membership, permissions.
4. Queue: enqueue routing, worker logic.
5. UI: component rendering, interactions, hooks.
6. Email templates: output assertions.

## Git & Commits

- Do not run `git commit`, `git push`, `git reset`, `git rebase` unless explicitly asked.
- Keep commits focused and atomic.
- Write concise commit messages matching repo style.

## Environment Variables

- Per-application env files: `artifacts/api/.env`, `artifacts/web/.env`.
- Web env vars must be prefixed with `VITE_` to be exposed to the client.
- Never commit `.env` files or secrets.

## Documentation

- Update `AGENTS.md` when changing build/test/dev workflows.
- Keep README focused on human contributors.
- Use `context/` files for agent/project context summaries.

---
## Where to Go Next

- Back to entry point: `AGENTS.md`
- Next in technical series: `context/library-docs.md`
- Related business context: AFFiNE OS (`https://affine.commissionkit.co`)
