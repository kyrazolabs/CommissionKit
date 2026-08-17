# Plan: Biome Lint + Format for CommissionKit

**Status:** Approved (design) — pending implementation
**Date:** 2026-08-17
**Author:** @nexus (coordinated), @forge / @pixel (implementation)
**Tool:** Biome (replaces ESLint + Prettier)

---

## 1. Goal

Enforce clean, readable, maintainable, and consistently formatted code across the monorepo by:

1. Adding a single lint + format tool (Biome).
2. Wiring it into the `build`/`typecheck` pipeline as a hard gate.
3. Running a one-time big-bang cleanup so the gate passes immediately and stays green.

## 2. Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Tool | **Biome only** | One tool replaces ESLint (lint) and Prettier (format). No ESLint/Prettier config reconciliation. Rust-native speed matters for the `build` path over 506 files. |
| Scope | **Option A — big-bang cleanup** | Run `biome check --write` across all files once, commit as isolated chore, then enforce going forward. |
| Scripts | **Root `package.json` only** | Biome operates repo-wide from the root; per-workspace scripts would be redundant. |
| `build` gating | `lint` (format-verify + lint) runs **before** `typecheck` | Format/lint is a fast, cheap gate; typecheck stays pure TypeScript. |

## 3. Dependencies

- Add `@biomejs/biome` (latest stable) as root `devDependencies` via `bun add -d @biomejs/biome`.
- **Keep `prettier` in root `devDependencies`.** Corrected from the earlier "remove" plan: `orval.config.ts` uses `prettier: true`, and `orval@8.5.2` declares `prettier` as a peer dependency (`>=3.0.0`). Removing it would break `bun run --filter @workspace/api-spec codegen`. Prettier is retained *solely* as Orval's codegen peer dep — Biome is the source formatter/linter.

## 4. Config & dotfiles

### 4.1 `biome.json` (repo root — single source of truth)

Representative sketch (exact rule IDs and `$schema` version finalized against the installed Biome version during implementation):

```jsonc
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "files": {
    "ignoreUnknown": true,
    "ignore": [
      "lib/api-client-react/src/generated/**",
      "lib/api-zod/src/generated/**",
      "artifacts/web/src/i18n/generated/**",
      "artifacts/blog/src/generated/**"
    ]
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100,
    "lineEnding": "lf"
  },
  "organizeImports": { "enabled": true },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "correctness": { "noConsoleLog": { "level": "error" } },
      "suspicious": { "noExplicitAny": { "level": "warn" } },
      "style": { "noUnusedImports": { "level": "warn" } }
    }
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "double",
      "semicolons": "always",
      "trailingCommas": "all",
      "jsxQuoteStyle": "double"
    }
  }
}
```

Biome also respects `.gitignore` automatically, so `node_modules`, `dist`, and build output are ignored without extra config.

### 4.2 `.editorconfig`

Basic cross-editor defaults: `utf-8`, `lf`, trailing newline, 2-space indent (space).

### 4.3 `.vscode/settings.json` + `.vscode/extensions.json`

- Set Biome as the default formatter (`editor.defaultFormatter`, `editor.formatOnSave`).
- Recommend the official `biomejs.biome` extension.
- Both files are already gitignore-whitelisted.

## 5. Package scripts

Root `package.json`:

```json
{
  "scripts": {
    "format":       "biome format --write .",
    "format:check": "biome format .",
    "lint":         "biome check .",
    "lint:fix":     "biome check --write .",
    "build":        "bun run lint && bun run typecheck && bun run --workspaces --if-present build"
  }
}
```

- `lint` = `biome check` = format-verify + lint in one pass.
- `build` gates on `lint` before `typecheck`.
- `typecheck` remains pure TypeScript (unchanged).

## 6. Rule posture

| Rule | Level | Notes |
|------|-------|-------|
| Biome `recommended` | error | Baseline correctness + style set. |
| `noConsoleLog` | error | Matches `code-standards.md`. Legit worker startup logs get `// biome-ignore`. |
| `noExplicitAny` | warn | Codebase uses `any` heavily; error now would be huge churn. Dial down later. |
| `noUnusedImports` / `noUnusedVariables` | warn | tsconfig has `noUnusedLocals: false`, so existing unused symbols exist. |
| `organizeImports` | on (auto-fix) | Sorts/cleans imports. |
| `useImportType` | on (auto-fix) | `import type` for type-only imports. |

Formatter uses Biome defaults (2-space, double quotes, semicolons, 100 width) to match existing style.

## 7. Big-bang execution (Option A)

1. `biome check --write .` — auto-fix formatting + safe lint fixes across 506 files.
2. Manually resolve remaining non-auto-fixable issues (mostly `noConsoleLog` startup logs → `// biome-ignore` or `logger`).
3. Verify:
   - `biome check .` exits 0 (clean).
   - `bun run typecheck` passes.
   - `bun test` still green (no behavioral changes).
4. Commit as one isolated `chore: format + lint autofix` commit (easy to review/revert; add to `.git-blame-ignore-revs` if desired).

## 8. CI

Add a `lint` job to `.github/workflows/ci.yml` (parallel with `typecheck`, dependency-free) running `bun run lint` on push/PR to `develop`/`staging`/`main`.

## 9. Docs to update

- `context/code-standards.md` — replace stale "Prettier (configured at repo root)" claim with Biome + new scripts.
- `AGENTS.md` — add `lint`/`format` to the dev-commands section.
- `context/progress-tracker.md` — record the change.

## 10. Success criteria

- [ ] `bun run lint` passes clean on a fresh checkout.
- [ ] `bun run format:check` passes clean.
- [ ] `bun run build` and `bun run typecheck` still pass.
- [ ] `bun test` still green (no behavior change).
- [ ] CI has a `lint` job.
- [ ] `prettier` retained (Orval peer dep) — no breakage to `api-spec codegen`.
- [ ] Docs updated.

## 11. Out of scope

- Per-workspace `lint`/`format` scripts (redundant — Biome runs repo-wide from root).
- Dialing `noExplicitAny`/`noUnusedVariables` down from warn → error (future follow-up).
- Enforcing the "no emojis in UI" and "no hardcoded hex" conventions via lint (not reliably lintable).
