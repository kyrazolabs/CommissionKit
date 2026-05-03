# CommissionKit

## Overview

CommissionKit is a commission tracking tool for small B2B sales teams (5-30 reps) who have outgrown spreadsheets. It replaces error-prone Excel/Google Sheets with a focused web app that imports deal data via CSV, automates tiered/flat/accelerator commission calculations, and gives every sales rep a clean, real-time earnings dashboard.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/commission-kit) — at previewPath "/"
- **API framework**: Express 5 (artifacts/api-server) — at previewPath "/api"
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **CSV parsing**: PapaParse (client-side)
- **Charts**: Recharts

## Features

- **Dashboard** — team commission overview: total commissions, revenue, top earners leaderboard, recent runs
- **Reps** — manage sales reps, assign commission plans
- **Plans** — visual plan builder for flat rate, tiered, and accelerator commission structures
- **Deals** — deal list with filters + CSV import flow (client-side parse, column mapping, preview)
- **Runs** — trigger commission calculation runs, view per-deal audit trail
- **Rep Portal** — individual rep earnings dashboard with deal-by-deal breakdown and monthly history chart

## Database Schema

Tables: `reps`, `plans`, `plan_tiers`, `deals`, `commission_runs`, `commission_results`

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## Important Notes

- The orval config does NOT generate separate TypeScript types (`schemas` option removed) to avoid naming conflicts with Zod exports. `lib/api-zod/src/index.ts` only exports from `./generated/api`.
- After running codegen, manually verify `lib/api-zod/src/index.ts` only has `export * from "./generated/api"` — orval may regenerate it with stale exports.

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
