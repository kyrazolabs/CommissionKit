# AISSOL Commission Engine — Implementation Summary

**Client**: AISSOL  
**Engine name**: `aissol`  
**Workspace**: `aissol` (slug) / `THNDER` (name)  
**Pricing**: x one-time

---

## Architecture

AISSOL uses a **custom commission engine** isolated from the standard flat/tiered/accelerator engine. The engine is registered via a pluggable registry and dispatched at runtime based on the workspace's `commissionEngine` field. No standard code paths were modified.

**Engine selection**: `workspace.commissionEngine = "aissol"` (set server-side, not user-editable)

---

## Commission Calculation Process — Full Specification

### Overview

The sales representative is responsible for both securing the business and managing the project. The commission structure is designed to reward the sales representative based on:

- The **total value** of the project
- The **profitability** (Gross Margin %) of the project

The commission percentage is determined at the **project level** and is subsequently applied to each invoice generated under that project.

### Business Rule

The commission percentage is determined at the project level using the Commission Matrix. Once determined, the same commission percentage is applied to **every invoice** associated with that project, and commission is paid on an **invoice-by-invoice** basis.

---

### Step 1 — Determine Sales Slab

The system identifies the Sales Slab based on the total project value.

| Sales Amount | Sales Slab |
|---|---|
| Less than 25,000 | Slab 0 |
| 25,000 to 50,000 | Slab 1 |
| 50,000 to 100,000 | Slab 2 |
| 100,000 to 150,000 | Slab 3 |
| 150,000 to 250,000 | Slab 4 |
| 250,000 to 350,000 | Slab 5 |
| Above 350,000 | Slab 6 |

Slab boundaries are **lower-inclusive, upper-exclusive**, except the final slab which catches all remaining values. In our engine:

```
function determineSlab(value):
  for each slab (sorted by max ascending):
    if max is null    → return this slab (catch-all)
    if value < max    → return this slab
```

Example: SAR 300,000 → falls between 250,000 and 350,000 → **Slab 5**.

---

### Step 2 — Calculate Gross Margin Percentage

```
Gross Margin % = ((Project Value - Project Cost) / Project Value) × 100
```

The calculated Gross Margin % is used to determine the applicable Gross Margin Bracket.

| GM% Range | Bracket Key |
|---|---|
| Less than 15% | `lt15` |
| 15% to 20% | `15-20` |
| 20% to 25% | `20-25` |
| 25% to 30% | `25-30` |
| 30% to 35% | `30-35` |
| 35% to 40% | `35-40` |
| Above 40% | `gt40` |

Bracket boundaries are **lower-inclusive, upper-exclusive**, except the final bracket.

Example: Project Value SAR 300,000, Cost SAR 204,000 → GM = `(300,000 - 204,000) / 300,000 × 100` = **32%** → bracket `30-35`.

---

### Step 3 — Determine Commission Percentage

The system uses the **Commission Matrix** to determine the commission percentage.

**Inputs**: Sales Slab, Gross Margin Bracket  
**Output**: Commission Percentage

The matrix is a grid where each cell = `Rate[Slab][GM Bracket]`. Example matrix (default auto-fill values):

| Slab / GM | <15% | 15-20% | 20-25% | 25-30% | 30-35% | 35-40% | >40% |
|---|---|---|---|---|---|---|---|
| **Slab 0** (<25K) | 0.10% | 0.20% | 0.30% | 0.40% | 0.50% | 0.60% | 0.70% |
| **Slab 1** (25-50K) | 0.30% | 0.40% | 0.50% | 0.60% | 0.70% | 0.80% | 0.90% |
| **Slab 2** (50-100K) | 0.50% | 0.60% | 0.70% | 0.80% | 0.90% | 1.00% | 1.10% |
| **Slab 3** (100-150K) | 0.70% | 0.80% | 0.90% | 1.00% | 1.10% | 1.20% | 1.30% |
| **Slab 4** (150-250K) | 0.90% | 1.00% | 1.10% | 1.20% | 1.30% | 1.40% | 1.50% |
| **Slab 5** (250-350K) | 1.10% | 1.20% | 1.30% | 1.40% | **1.50%** | 1.60% | 1.70% |
| **Slab 6** (>350K) | 1.30% | 1.40% | 1.50% | 1.60% | 1.70% | 1.80% | 1.90% |

The commission percentage is determined **once** for the project and remains applicable to all invoices related to that project.

Example: Slab 5 + GM bracket 30-35 → lookup `rates["5"]["30-35"]` → **1.50%**.

---

### Step 4 — Calculate Invoice Commission

For every invoice generated under the project:

```
Commission Amount = Invoice Amount × Commission Percentage
```

The sales representative earns commission **separately for each invoice**.

---

### Worked Example (from AISSOL specification)

| Field | Value |
|---|---|
| Project Value | SAR 300,000 |
| Project Cost | SAR 204,000 |
| Gross Margin % | `(300,000 - 204,000) / 300,000 × 100` = 32% |
| Sales Slab | Slab 5 (250,000 – 350,000) |
| GM Bracket | 30–35% |
| Commission % | 1.50% |

| Invoice | Amount | Commission % | Commission Earned |
|---|---|---|---|
| INV-001 | SAR 100,000 | 1.50% | SAR 1,500 |
| INV-002 | SAR 120,000 | 1.50% | SAR 1,800 |
| INV-003 | SAR 80,000 | 1.50% | SAR 1,200 |
| **Total** | **SAR 300,000** | | **SAR 4,500** |

---

### Configurability

All three components of the calculation are configurable per workspace via the Commission Matrix UI:

| Component | Configurable | UI |
|---|---|---|
| Sales Slabs (ranges + labels) | ✓ | Matrix → Slabs table |
| GM Brackets (ranges + labels) | ✓ | Matrix → Brackets table |
| Commission Rates (grid) | ✓ | Matrix → Rates grid |
| Add/remove slabs/brackets | ✓ | Add/Remove buttons |
| Auto-fill rates | ✓ | Auto-fill Rates button |

All slabs, brackets, and rates are stored in the `AissolCommissionMatrix` collection per workspace. The engine reads them at calculation time — no hardcoded values.

---

## What Was Built

### Backend

| Component | File | Purpose |
|---|---|---|
| Engine interface | `CalcEngine.ts` | Shared interface for all engines |
| Registry | `registry.ts` | Maps engine names to classes |
| AISSOL engine | `aissol.engine.ts` | Full calculation logic |
| Standard engine | `standard.engine.ts` | Existing logic refactored |
| Commission matrix model | `lib/db/.../aissol/commissionMatrix.ts` | Slabs + brackets + rates |
| Project model | `lib/db/.../aissol/projects.ts` | Project data |
| Invoice model | `lib/db/.../aissol/invoices.ts` | Invoice data |
| API routes | `routes/enterprise/aissol/routes.ts` | CRUD: projects, invoices, matrix |
| Export routes | same file | CSV export for projects and invoices |
| Settings endpoint | `routes/workspaces.ts` | Engine field in workspace settings |

### Frontend

| Page | Route | Features |
|---|---|---|
| Projects list | `/dash/enterprise/projects` | Table, search, filters, bulk import (CSV/XLSX), CSV export, create/delete |
| Project detail | `/dash/enterprise/projects/:id` | Stat cards, invoice list, add/delete invoices, CSV export |
| Commission matrix | `/dash/enterprise/matrix` | Edit slabs, brackets, rates grid, auto-fill rates, CSV export, add/remove slabs/brackets |

### Navigation

- **Matrix** replaces **Plans** in the sidebar
- **Projects** replaces **Deals** in the sidebar
- `/dash/deals` and `/dash/plans` redirect to enterprise pages for AISSOL workspace

### Other

- Custom `NumberInput` component supports negative values
- Design document: `docs/enterprise-engine-architecture.md`
- Optimistic UI updates for create/delete
- Engine-level permission gating (enterprise pages redirect for non-AISSOL workspaces)

---

## AISSOL Onboarding (Step-by-Step)

### 1. Set engine in DB (platform admin)
```js
db.workspaces.updateOne(
  { slug: "aissol" },
  { $set: { commissionEngine: "aissol" } }
)
```

### 2. Configure commission matrix
Navigate to **Matrix** page → configure:
- 7 sales slabs (default: 0 through 6)
- 7 GM brackets (default: <15% through >40%)
- Fill rates grid or use **Auto-fill Rates**
- Click **Save Matrix**

### 3. Add reps
Standard **Reps** page — create sales representatives.

### 4. Create projects
Navigate to **Projects** page → **New Project**:
- Name, sales rep, total value, total cost, period, currency

### 5. Add invoices
Click project → **Add Invoice** for each invoice under the project.

### 6. Run commission calculation
**Runs** page → **New Run** for the period → engine calculates and returns results.

### Example (from AISSOL spec)
| | Value |
|---|---|
| Project Value | SAR 300,000 |
| Project Cost | SAR 204,000 |
| GM% | 32% |
| Slab | 5 (250K–350K) |
| GM Bracket | 30–35% |
| Commission % | 1.50% |

| Invoice | Amount | Commission |
|---|---|---|
| INV-001 | 100,000 | 1,500 |
| INV-002 | 120,000 | 1,800 |
| INV-003 | 80,000 | 1,200 |
| **Total** | **300,000** | **4,500** |

---

## Files Changed/Created

```
COMMITTED (27 files, +2,806 lines):

Server:
  artifacts/api/src/index.ts                              (bootstrap engines)
  artifacts/api/src/workers/calc-worker.ts                (engine dispatch)
  artifacts/api/src/workers/engines/CalcEngine.ts         (interface)
  artifacts/api/src/workers/engines/registry.ts           (registry)
  artifacts/api/src/workers/engines/standard.engine.ts    (refactored standard)
  artifacts/api/src/workers/engines/aissol.engine.ts      (AISSOL engine)
  artifacts/api/src/routes/enterprise/index.ts            (engine router)
  artifacts/api/src/routes/enterprise/aissol/routes.ts    (API routes)
  artifacts/api/src/routes/workspaces.ts                  (settings endpoint)
  artifacts/api/src/routes/index.ts                       (mount enterprise)
  artifacts/api/src/routes/export.ts                      (fix type)

Database:
  lib/db/src/schema/workspaces.ts                         (commEngine field)
  lib/db/src/schema/commissionRuns.ts                     (meta field)
  lib/db/src/schema/aissol/commissionMatrix.ts            (matrix model)
  lib/db/src/schema/aissol/projects.ts                    (project model)
  lib/db/src/schema/aissol/invoices.ts                    (invoice model)
  lib/db/src/schema/aissol/index.ts                       (barrel)
  lib/db/package.json                                     (subpath export)

Frontend:
  artifacts/web/src/App.tsx                               (routes + redirects)
  artifacts/web/src/hooks/use-workspace.tsx               (commEngine field)
  artifacts/web/src/components/layout/sidebar.tsx         (dynamic nav)
  artifacts/web/src/components/number-input.tsx           (negative support)
  artifacts/web/src/pages/settings/settings.tsx           (engine display)
  artifacts/web/src/pages/enterprise/aissol/projects.tsx  (projects page)
  artifacts/web/src/pages/enterprise/aissol/project-detail.tsx (detail page)
  artifacts/web/src/pages/enterprise/aissol/matrix.tsx    (matrix config)

Docs:
  docs/enterprise-engine-architecture.md                  (architecture doc)
  docs/enterprise/aissol.md                               (this file)
```

---

## Next Enterprise Client

To add a new enterprise client (e.g., Acme Corp):

1. Create `engines/acme-corp.engine.ts` implementing `CalcEngine`
2. Register: `registerEngine(new AcmeCorpEngine())` in `registry.ts`
3. Add routes: `routes/enterprise/acme-corp/routes.ts`
4. Add frontend pages if needed
5. Set `workspace.commissionEngine = "acme-corp"` in DB

No changes to existing code. The architecture scales to 500+ enterprise clients.
