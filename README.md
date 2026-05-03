# CommissionKit

Dead-simple commission tracking for small B2B sales teams (5–30 reps). Import deals via CSV, model flat/tiered/accelerator plans, run calculations, and give reps a clean earnings dashboard with an audit trail.

## Monorepo layout

- `artifacts/web`: React + Vite web app (UI)
- `artifacts/api`: Express API server
- `lib/db`: Drizzle ORM schema + migrations/push scripts
- `lib/api-spec`: OpenAPI + Orval codegen entrypoint
- `lib/api-zod`: Zod schemas generated from the API spec
- `lib/api-client-react`: React Query client helpers
- `scripts`: small workspace scripts (dev utilities)

## Tech stack

- **Runtime / package manager**: Bun
- **Node.js**: 24 (used by some tooling/build scripts)
- **Frontend**: React 19 + Vite + Tailwind
- **Backend**: Express 5
- **DB**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (v4) + `drizzle-zod`
- **API codegen**: Orval

## Prerequisites

- Bun installed (`bun --version`)
- Node.js 24 available on your machine (some scripts/tools run on Node)
- PostgreSQL database (local or hosted)

## Environment variables

Create a `.env` file at the repo root:

```bash
cp .env.example .env
```

Required/commonly used variables:

- `SUPABASE_DB_URL`: Postgres connection string (used by Drizzle)
- `SESSION_SECRET`: API session/auth secret
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`: Supabase client config (used by API and mapped into the UI at build time)
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`: optional explicit Vite vars for the UI (takes precedence if set)
- `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`: Stripe config (API and UI)
- `VITE_STRIPE_PUBLISHABLE_KEY`: optional explicit Vite var for the UI (takes precedence if set)

## Install

```bash
bun install
```

## Develop

This repo is a multi-service monorepo. Run the pieces you need in separate terminals.

### API server (Express)

```bash
bun run --filter @workspace/api dev
```

Default port: `8080` (health: `/api/healthz`).

### Web app (React + Vite)

```bash
bun run --filter @workspace/web dev
```

Default port: `21889`

## Build

Build everything (typecheck + build across workspaces):

```bash
bun run build
```

Typecheck only:

```bash
bun run typecheck
```

## Database workflows (Drizzle)

Push schema changes to your dev database:

```bash
bun run --filter @workspace/db push
```

Force push (destructive; dev only):

```bash
bun run --filter @workspace/db push-force
```

## API code generation (Orval)

Regenerate client hooks / schemas from the OpenAPI spec:

```bash
bun run --filter @workspace/api-spec codegen
```

Note: `lib/api-zod/src/index.ts` is intended to only export `./generated/api`. If codegen rewrites exports, fix it before committing.

## Common commands

- `bun install`: install all workspace dependencies
- `bun run typecheck`: typecheck across packages
- `bun run build`: typecheck + build all packages
- `bun run --workspaces --if-present <script>`: run a script across all workspaces that define it
- `bun run --filter <pattern> <script>`: run a script in matching workspaces (name or path patterns)

## Deployment notes (Replit)

The repo includes Replit service definitions under `artifacts/*/.replit-artifact/`.

- Web build output: `artifacts/web/dist/public`
- API production entry: `artifacts/api/dist/index.mjs`

## License

MIT

