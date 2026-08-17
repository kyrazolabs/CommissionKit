# Biome Lint + Format — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Biome as the single lint + format tool, run a one-time big-bang cleanup, and wire `lint` into the `build`/CI pipeline so the codebase stays clean, readable, and consistently formatted.

**Architecture:** One Rust binary (`@biomejs/biome`) replaces ESLint + Prettier. A single root `biome.json` config drives formatting, import organization, and lint rules repo-wide. Generated code is excluded via `files.ignore` (Biome also respects `.gitignore`). Root `package.json` scripts expose `lint`/`format`, and `build` gates on `lint` before `typecheck`.

**Tech Stack:** Bun 1.3.x, Biome 2.5.x, TypeScript 5.9, React 19.

## Global Constraints

- **Bun only** — no `npm`/`yarn`/`pnpm`. Use `bun run`, `bun add`, `bun x`.
- **Biome version:** latest stable 2.x (verified 2.5.8 at plan time). `$schema` URL must match the installed version.
- **Keep `prettier` in root devDependencies** — it is a peer dependency of `orval@8.5.2` (`orval.config.ts` sets `prettier: true`). Do NOT remove it.
- **Do not touch generated code:** ignore `lib/api-client-react/src/generated/**`, `lib/api-zod/src/generated/**`, `artifacts/web/src/i18n/generated/**`, `artifacts/blog/src/generated/**`.
- **`noConsoleLog` is error** — matches `context/code-standards.md`. Legit worker startup logs get `// biome-ignore lint/correctness/noConsoleLog: <reason>`.
- **`noExplicitAny` and `noUnusedVariables`/`noUnusedImports` are `warn`** — not blocking (codebase uses `any` heavily; tsconfig has `noUnusedLocals: false`).
- **Every commit must leave `develop` green** — order tasks so the `build` gate is wired only after the big-bang cleanup makes `biome check` pass.

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `biome.json` | Create | Single source of truth: formatter + linter + organizeImports + ignore list |
| `.editorconfig` | Create | Cross-editor whitespace/charset defaults |
| `.vscode/settings.json` | Create | Biome as default formatter, format-on-save |
| `.vscode/extensions.json` | Create | Recommend `biomejs.biome` extension |
| `package.json` | Modify | Add `format`/`format:check`/`lint`/`lint:fix`; wire `lint` into `build` |
| `.github/workflows/ci.yml` | Modify | Add `lint` job |
| `context/code-standards.md` | Modify | Replace stale "Prettier configured" claim |
| `AGENTS.md` | Modify | Add `lint`/`format` to dev commands |
| `context/progress-tracker.md` | Modify | Record the change |

---

### Task 1: Install Biome + config + dotfiles + scripts (no build gating yet)

**Files:**
- Modify: `package.json` (root)
- Create: `biome.json`, `.editorconfig`, `.vscode/settings.json`, `.vscode/extensions.json`

**Interfaces:**
- Produces: `bun run lint` → `biome check .`, `bun run lint:fix` → `biome check --write .`, `bun run format` → `biome format --write .`, `bun run format:check` → `biome format .`.

- [ ] **Step 1: Install Biome**

```bash
bun add -d @biomejs/biome
```

Verify the installed version:

```bash
bun x @biomejs/biome --version
```

Expected: `2.x.y`. Record this exact version — it goes in the `$schema` URL in Step 2.

- [ ] **Step 2: Create `biome.json`**

Write this file at repo root (replace `2.5.8` in `$schema` with the version printed in Step 1):

```jsonc
{
  "$schema": "https://biomejs.dev/schemas/2.5.8/schema.json",
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
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "correctness": {
        "noConsoleLog": { "level": "error" },
        "noUnusedVariables": { "level": "warn" }
      },
      "suspicious": {
        "noExplicitAny": { "level": "warn" }
      },
      "style": {
        "noUnusedImports": { "level": "warn" }
      }
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

- [ ] **Step 3: Create `.editorconfig`**

```ini
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
indent_style = space
indent_size = 2
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false
```

- [ ] **Step 4: Create `.vscode/settings.json`**

```json
{
  "editor.defaultFormatter": "biomejs.biome",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports.biome": "explicit",
    "quickfix.biome": "explicit"
  },
  "[javascript]": { "editor.defaultFormatter": "biomejs.biome" },
  "[typescript]": { "editor.defaultFormatter": "biomejs.biome" },
  "[typescriptreact]": { "editor.defaultFormatter": "biomejs.biome" },
  "[json]": { "editor.defaultFormatter": "biomejs.biome" },
  "[jsonc]": { "editor.defaultFormatter": "biomejs.biome" }
}
```

- [ ] **Step 5: Create `.vscode/extensions.json`**

```json
{
  "recommendations": ["biomejs.biome"]
}
```

- [ ] **Step 6: Add scripts to root `package.json`**

Add these four scripts (do NOT modify `build` yet — that happens in Task 3):

```jsonc
"format":       "biome format --write .",
"format:check": "biome format .",
"lint":         "biome check .",
"lint:fix":     "biome check --write ."
```

- [ ] **Step 7: Commit**

```bash
git add package.json bun.lock biome.json .editorconfig .vscode/settings.json .vscode/extensions.json
git commit -m "chore: add Biome lint + format config"
```

---

### Task 2: Big-bang cleanup (format + lint autofix across all files)

**Files:** (auto-modified repo-wide — no manual file list; `biome check --write` touches source under `artifacts/`, `lib/`, `plugins/`, `scripts/`)

**Interfaces:**
- Consumes: `biome.json` from Task 1.
- Produces: a codebase where `bun run lint` exits 0.

- [ ] **Step 1: Baseline the error count (optional but useful)**

```bash
bun run lint 2>&1 | tail -20
```

Expected: a large number of formatting/lint findings (this is the "before" state). Record roughly how many files are reported so you can sanity-check the diff size.

- [ ] **Step 2: Auto-fix formatting + safe lint fixes**

```bash
bun run lint:fix
```

This runs `biome check --write .`, applying formatting, import organization, and all auto-fixable lint rules.

- [ ] **Step 3: Re-run lint and inspect what remains**

```bash
bun run lint 2>&1 | tail -40
```

Remaining findings should be only non-auto-fixable rules. The expected residue is `correctness/noConsoleLog` (worker startup logs) and `warn`-level `noExplicitAny`/`noUnusedVariables`/`noUnusedImports` (which do NOT fail `biome check`).

- [ ] **Step 4: Resolve `noConsoleLog` errors**

`noConsoleLog` is `error`, so any remaining violation fails the gate. For each violation in a legitimate worker startup path (e.g. `artifacts/api/src/index.ts`, BullMQ worker bootstrap), add an inline disable with a reason:

```ts
// biome-ignore lint/correctness/noConsoleLog: worker startup log, permitted by code-standards
console.log("worker started");
```

For any `console.log` that is NOT a startup log, replace it with the Pino logger (`import { logger } from "@/lib/logger"` → `logger.info(...)`) or remove it, per `context/code-standards.md`.

- [ ] **Step 5: Verify lint is clean**

```bash
bun run lint
```

Expected: exit code 0 (no error-level findings). `warn` findings are allowed.

- [ ] **Step 6: Verify typecheck passes**

```bash
bun run typecheck
```

Expected: exit code 0. (Import reorganization can occasionally surface a now-unused import or reordering that tsc flags — fix if so.)

- [ ] **Step 7: Verify tests are green (no behavioral change)**

```bash
bun test
```

Expected: same pass/fail as before the change (the pre-existing `setup-checklist.test.tsx` failures remain; do not fix them in this task). Formatting/lint must not change any test outcome.

- [ ] **Step 8: Commit as an isolated chore**

```bash
git add -A
git commit -m "chore: format + lint autofix across monorepo"
```

Note: this is a large, mechanical diff. Keep it isolated (no functional changes mixed in) so it is easy to review and to add to `.git-blame-ignore-revs` later.

---

### Task 3: Wire `build` gating + CI lint job

**Files:**
- Modify: `package.json` (root `build` script)
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: `bun run lint` (clean after Task 2).
- Produces: `bun run build` fails if lint fails; CI has a `lint` job.

- [ ] **Step 1: Update the `build` script**

In root `package.json`, change:

```jsonc
"build": "bun run typecheck && bun run --workspaces --if-present build",
```

to:

```jsonc
"build": "bun run lint && bun run typecheck && bun run --workspaces --if-present build",
```

`lint` runs first (cheap, fast) so failures surface before the slow typecheck + build.

- [ ] **Step 2: Verify the full build path**

```bash
bun run build
```

Expected: exit code 0 — `lint` passes, `typecheck` passes, all workspace builds complete.

- [ ] **Step 3: Add a `lint` job to CI**

In `.github/workflows/ci.yml`, add this job after the `typecheck` job (no `needs`, so it runs in parallel):

```yaml
  lint:
    name: Lint & Format
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: ${{ env.BUN_VERSION }}

      - name: Cache Bun dependencies
        uses: actions/cache@v4
        with:
          path: ~/.bun/install/cache
          key: bun-${{ runner.os }}-${{ hashFiles('bun.lock') }}
          restore-keys: bun-${{ runner.os }}-

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Lint & format check
        run: bun run lint
```

- [ ] **Step 4: Commit**

```bash
git add package.json .github/workflows/ci.yml
git commit -m "chore: gate build on lint + add CI lint job"
```

---

### Task 4: Update docs

**Files:**
- Modify: `context/code-standards.md`
- Modify: `AGENTS.md`
- Modify: `context/progress-tracker.md`

**Interfaces:** none (documentation only).

- [ ] **Step 1: Update `context/code-standards.md`**

In the `## General` section, replace:

```markdown
- **Formatting**: Prettier (configured at repo root).
...
- **Linting**: TypeScript `strictNullChecks: true`, no implicit any.
```

with:

```markdown
- **Formatting & Linting**: Biome (see `biome.json` at repo root). Run `bun run lint` / `bun run format`. Prettier is retained only as an Orval codegen peer dependency, not as the source formatter.
- **TypeScript strictness**: `strictNullChecks: true`, `noImplicitAny: true`. `noUnusedLocals`/`strictFunctionTypes` remain relaxed; Biome's `noExplicitAny`/`noUnusedVariables` are `warn`-level.
```

- [ ] **Step 2: Update `AGENTS.md` dev commands**

In the `## Dev commands` section, add to the code block:

```bash
# Lint + format check (Biome)
bun run lint

# Auto-fix lint + format
bun run lint:fix

# Format only
bun run format
```

Also add a one-line note under `## Immutable Rules`: `- **Biome lint on build.** `bun run build` runs `biome check`; keep the tree lint-clean.`

- [ ] **Step 3: Update `context/progress-tracker.md`**

Add an entry to `## 10. Recent Changes`:

```markdown
- **Biome lint + format (P1)**: Added `@biomejs/biome` as the single lint + format tool, replacing ESLint+Prettier. Root `biome.json` (recommended rules + `noConsoleLog` error + `any`/unused as warnings), `.editorconfig`, and `.vscode` settings. New scripts `format`, `format:check`, `lint`, `lint:fix`; `build` now gates on `lint` before `typecheck`; CI gains a `lint` job. Ran one-time big-bang `biome check --write` across 506 TS/TSX files. Prettier retained solely as an Orval codegen peer dependency. See `docs/plan-biome-lint-format.md`.
```

- [ ] **Step 4: Commit**

```bash
git add context/code-standards.md AGENTS.md context/progress-tracker.md
git commit -m "docs: document Biome lint + format workflow"
```

---

## Self-Review Notes (already applied)

- **Spec coverage:** tool install (Task 1), config + dotfiles (Task 1), scripts (Task 1 + 3), big-bang (Task 2), CI (Task 3), docs (Task 4) — all spec sections covered.
- **Prettier correction:** spec originally said "remove prettier"; corrected to "keep as Orval peer dep" (verified `orval@8.5.2` peerDependencies include `prettier >=3.0.0`).
- **Ordering:** `build` gating (Task 3) is wired only after `bun run lint` is clean (Task 2), keeping every commit on `develop` green.
- **Type consistency:** scripts `lint`/`lint:fix`/`format`/`format:check` named identically across Task 1, Task 3, and CI job.
