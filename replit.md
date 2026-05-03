# CommissionKit

## Overview

CommissionKit is a commission tracking tool for small B2B sales teams (5-30 reps) who have outgrown spreadsheets. It replaces error-prone Excel/Google Sheets with a focused web app that imports deal data via CSV, automates tiered/flat/accelerator commission calculations, and gives every sales rep a clean, real-time earnings dashboard.

## Stack

- **Monorepo tool**: Bun workspaces
- **Node.js version**: 24
- **Package manager**: Bun
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/web) — at previewPath "/"
- **API framework**: Express 5 (artifacts/api) — at previewPath "/api"
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

- `bun run typecheck` — full typecheck across all packages
- `bun run build` — typecheck + build all packages
- `bun run --filter @workspace/api-spec codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `bun run --filter @workspace/db push` — push DB schema changes (dev only)

## Design System

- **Canvas**: `#010102` near-pure black (dark mode); white `#ffffff` (light mode)
- **Primary accent**: Linear lavender-blue `#5e6ad2` — used on brand mark, active nav, CTAs, commission values, focus rings; replaces old teal
- **Surface ladder** (dark): canvas `#010102` → surface-1 `#0f1011` (cards) → surface-2 `#141516` (popover) — hierarchy via surface lift, no shadows
- **Hairline borders**: `#23252a` (dark) / `#e5e7eb` (light) — 1px, never heavier
- **Typography**: Inter 400/500/600/700 with aggressive negative letter-spacing on headings (`-0.03em`)
- **Radius**: `--radius: 0.75rem` (12px = `rounded-lg` for cards; `rounded-md` ~10px for buttons)
- **Dark/light toggle**: Moon/Sun in sidebar bottom-right; defaults to system preference, stored in `localStorage("ck-theme")`
- **Theme provider**: `artifacts/web/src/hooks/use-theme.tsx`
- **Sidebar groups**: MAIN (Dashboard, Reps, Plans) and OPERATIONS (Deals, Runs)

## Important Notes

- The orval config does NOT generate separate TypeScript types (`schemas` option removed) to avoid naming conflicts with Zod exports. `lib/api-zod/src/index.ts` only exports from `./generated/api`.
- After running codegen, manually verify `lib/api-zod/src/index.ts` only has `export * from "./generated/api"` — orval may regenerate it with stale exports.

See `package.json` workspaces for workspace structure, TypeScript setup, and package details.
