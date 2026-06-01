# Enterprise Commission Engine Architecture

## Problem

Enterprise customers need custom commission calculation logic that differs fundamentally from the standard flat/tiered/accelerator model. Example: AISSOL needs project-level slab+margin-matrix calculations applied to invoices.

Adding enterprise logic directly to the existing worker creates spaghetti. Branching per customer creates merge hell.

## Solution: Pluggable Engine Pattern

Each enterprise customer gets their own **isolated engine file** registered in a central registry. The calc worker dispatches to the correct engine at runtime based on the workspace's `commissionEngine` setting.

```
                        Workspace
                            │
                    commissionEngine
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
         "standard"    "aissol"    "acme-corp"
              │             │             │
              ▼             ▼             ▼
       standard.engine  aissol.engine  acme-corp.engine
```

### Directory Layout

```
artifacts/api/src/workers/engines/
├── CalcEngine.ts          # Interface
├── registry.ts            # Engine lookup map
├── standard.engine.ts     # Default engine (existing logic, moved here)
├── aissol.engine.ts       # AISSOL enterprise engine
└── README.md              # How to add a new engine

lib/db/src/schema/
├── aissol/                # AISSOL-specific models
│   ├── index.ts
│   ├── commissionMatrix.ts
│   ├── projects.ts
│   └── invoices.ts
├── ...                    # Existing models untouched

artifacts/api/src/routes/
├── enterprise/
│   ├── aissol/
│   │   ├── projects.ts
│   │   ├── invoices.ts
│   │   └── commission-matrix.ts
│   └── index.ts           # Conditionally mounts enterprise routes
```

### Key Principle: Everything Is Additive

- Existing `calc-worker.ts` is **not modified** beyond adding a ~10-line dispatch
- Existing DB models and routes are **untouched**
- Enterprise engines are **lazy-loaded** — standard workspaces never import enterprise code
- Each enterprise engine is a **single file** (plus its own DB models if needed)

---

## 1. Engine Interface

```typescript
// artifacts/api/src/workers/engines/CalcEngine.ts

export interface CalcEngineInput {
  workspaceId: string;
  runId: string;
  period: string;
  paymentStatuses?: ("unpaid" | "paid" | "partial" | "on_hold")[];
  wsCurrency: string;       // workspace default currency
}

export interface CalcEngineOutput {
  results: {
    repId: string;
    dealId: string;           // or invoiceId for invoice-based engines
    rateApplied: number;
    commissionAmount: number;
    currency: string;
    calculationNote: string;
    // multi-currency snapshot (optional but recommended)
    wsCurrency?: string;
    convertedDealAmount?: number;
    convertedCommission?: number;
    exchangeRateSnapshot?: number;
    rateSnapshotDate?: string;
    // engine-specific metadata (opaque to the worker)
    meta?: Record<string, unknown>;
  }[];
  summary: {
    totalCommission: number;
    totalItems: number;       // deals or invoices processed
    skippedItems: number;
    involvedReps: Set<string>;
  };
}

export interface CalcEngine {
  /** Unique identifier registered in the registry */
  readonly name: string;

  /** Human-readable label for UI */
  readonly label: string;

  /** Run the commission calculation for a period */
  calculate(input: CalcEngineInput): Promise<CalcEngineOutput>;

  /**
   * Optional: whether this engine needs custom data models.
   * If true, the worker ensures those models are imported before calling calculate().
   */
  readonly requiresModels?: string[];
}
```

The `calculate()` method is the only required method. The worker:
1. Looks up the workspace's `commissionEngine`
2. Gets the engine from registry
3. Calls `engine.calculate(input)`
4. Saves results to the existing `CommissionResult` collection
5. Updates the existing `CommissionRun` record with summary data

This means **all engines write to the same result collections**. The standard dashboard, reports, and payouts all work without modification.

---

## 2. Engine Registry

```typescript
// artifacts/api/src/workers/engines/registry.ts

import type { CalcEngine } from "./CalcEngine";

const registry = new Map<string, CalcEngine>();

export function registerEngine(engine: CalcEngine): void {
  if (registry.has(engine.name)) {
    throw new Error(`Engine "${engine.name}" is already registered`);
  }
  registry.set(engine.name, engine);
}

export function getEngine(name: string): CalcEngine {
  const engine = registry.get(name);
  if (!engine) {
    throw new Error(`Unknown commission engine: "${name}"`);
  }
  return engine;
}

/** Pre-register all engines at startup */
export async function bootstrapEngines(): Promise<void> {
  // Standard engine — always loaded
  const { StandardEngine } = await import("./standard.engine");
  registerEngine(new StandardEngine());

  // Enterprise engines — lazy, only imported when needed
  // (imported here at bootstrap but could be made fully lazy if needed)
  try {
    const { AissolEngine } = await import("./aissol.engine");
    registerEngine(new AissolEngine());
  } catch {
    // AISSOL engine may not exist in all deployments
  }
}
```

`bootstrapEngines()` is called once at server startup in `index.ts`, right after the DB connection.

---

## 3. Standard Engine (Refactored, Not Rewritten)

```typescript
// artifacts/api/src/workers/engines/standard.engine.ts

export class StandardEngine implements CalcEngine {
  name = "standard";
  label = "Standard (Flat / Tiered / Accelerator)";

  async calculate(input: CalcEngineInput): Promise<CalcEngineOutput> {
    // Move existing calc-worker.ts logic here:
    // - Fetch Reps, Plans, PlanTiers, Deals for the workspace+period
    // - Run existing calculateCommission() per deal
    // - Return results + summary
    // (Same code, just in a class wrapper)
  }
}
```

The existing `calculateCommission()` function and the deal-by-deal loop in `calc-worker.ts` (lines 50–122 and 190–264) move into this class. The calc worker becomes a thin dispatcher (see Section 7).

---

## 4. AISSOL Engine — Specification

### 4.1 Calculation Overview

```
For each PROJECT in the period:
  ├── Step 1: Determine Sales Slab from project total value
  ├── Step 2: Calculate Gross Margin % = (Value - Cost) / Value × 100
  ├── Step 3: Look up Commission % in Commission Matrix (Slab × GM Bracket)
  │
  └── For each INVOICE under the project:
        Commission = Invoice Amount × Commission %
```

### 4.2 Sales Slabs

| Sales Amount (SAR) | Slab |
|---|---|
| < 25,000 | Slab 0 |
| 25,000 – 50,000 | Slab 1 |
| 50,000 – 100,000 | Slab 2 |
| 100,000 – 150,000 | Slab 3 |
| 150,000 – 250,000 | Slab 4 |
| 250,000 – 350,000 | Slab 5 |
| > 350,000 | Slab 6 |

### 4.3 Commission Matrix

The matrix maps (Sales Slab, GM Bracket) → Commission Percentage. This must be configurable per workspace — stored in the DB.

Example structure (from the provided document):

| Slab / GM% | <15% | 15-20% | 20-25% | 25-30% | 30-35% | 35-40% | >40% |
|---|---|---|---|---|---|---|---|
| Slab 0 | 0.00% | 0.00% | 0.00% | 0.00% | 0.00% | 0.00% | 0.00% |
| Slab 1 | 0.20% | 0.30% | 0.40% | 0.50% | 0.60% | 0.70% | 0.80% |
| Slab 2 | 0.40% | 0.50% | 0.60% | 0.70% | 0.80% | 0.90% | 1.00% |
| Slab 3 | 0.60% | 0.70% | 0.80% | 0.90% | 1.00% | 1.10% | 1.20% |
| Slab 4 | 0.80% | 0.90% | 1.00% | 1.10% | 1.20% | 1.30% | 1.40% |
| Slab 5 | 1.00% | 1.10% | 1.20% | 1.30% | 1.40% | 1.50% | 1.60% |
| Slab 6 | 1.20% | 1.30% | 1.40% | 1.50% | 1.60% | 1.70% | 1.80% |

### 4.4 Algorithm (Pseudocode)

```typescript
calculate(input: CalcEngineInput): CalcEngineOutput {
  // 1. Load AISSOL-specific data for the workspace
  const matrix   = await CommissionMatrix.findOne({ workspaceId });
  const projects = await AissolProject.find({ workspaceId, period: input.period });
  const invoices = await AissolInvoice.find({
    projectId: { $in: projects.map(p => p._id) },
    period: input.period,
  });

  // 2. Group invoices by project
  const invoicesByProject = groupBy(invoices, "projectId");

  const results = [];
  let totalCommission = 0;
  const involvedReps = new Set<string>();

  for (const project of projects) {
    // Step 1: Sales Slab
    const slab = this.determineSlab(project.totalValue);

    // Step 2: Gross Margin %
    const gmPercent = ((project.totalValue - project.totalCost) / project.totalValue) * 100;
    const gmBracket = this.determineGmBracket(gmPercent);

    // Step 3: Commission % from matrix
    const commissionPct = matrix.data[slab]?.[gmBracket] ?? 0;

    // Step 4: Apply to each invoice
    const projectInvoices = invoicesByProject.get(project._id.toString()) ?? [];
    for (const invoice of projectInvoices) {
      const commission = invoice.amount * commissionPct;
      totalCommission += commission;
      involvedReps.add(project.repId.toString());

      results.push({
        repId: project.repId.toString(),
        dealId: invoice._id.toString(),    // reuse dealId field for invoice ID
        rateApplied: commissionPct,
        commissionAmount: commission,
        currency: invoice.currency || "SAR",
        calculationNote: `Slab ${slab}, GM ${gmPercent.toFixed(1)}%, Matrix Rate ${(commissionPct*100).toFixed(2)}%`,
        meta: {
          engineType: "aissol",
          projectId: project._id,
          invoiceId: invoice._id,
          slab,
          gmPercent: Math.round(gmPercent * 100) / 100,
          gmBracket,
        },
      });
    }
  }

  return {
    results,
    summary: {
      totalCommission,
      totalItems: results.length,
      skippedItems: 0,
      involvedReps,
    },
  };
}

determineSlab(value: number): number {
  if (value < 25000)  return 0;
  if (value < 50000)  return 1;
  if (value < 100000) return 2;
  if (value < 150000) return 3;
  if (value < 250000) return 4;
  if (value < 350000) return 5;
  return 6;
}

determineGmBracket(gmPercent: number): string {
  if (gmPercent < 15) return "lt15";
  if (gmPercent < 20) return "15-20";
  if (gmPercent < 25) return "20-25";
  if (gmPercent < 30) return "25-30";
  if (gmPercent < 35) return "30-35";
  if (gmPercent < 40) return "35-40";
  return "gt40";
}
```

---

## 5. Database Models (AISSOL)

### 5.1 Commission Matrix

```typescript
// lib/db/src/schema/aissol/commissionMatrix.ts

const AissolCommissionMatrixSchema = new Schema({
  workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, unique: true },
  // Nested map: data[slabIndex][gmBracket] = rate (as fraction, e.g. 0.015 = 1.5%)
  data: {
    type: Map,
    of: {
      type: Map,
      of: Number,
    },
    required: true,
  },
}, { timestamps: true });

// Indexed JSON structure:
// {
//   "0": { "lt15": 0.000, "15-20": 0.000, ..., "gt40": 0.000 },
//   "1": { "lt15": 0.002, "15-20": 0.003, ..., "gt40": 0.008 },
//   ...
//   "6": { "lt15": 0.012, "15-20": 0.013, ..., "gt40": 0.018 },
// }
```

### 5.2 Projects

```typescript
// lib/db/src/schema/aissol/projects.ts

const AissolProjectSchema = new Schema({
  workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
  repId:      { type: Schema.Types.ObjectId, ref: "Rep", required: true },
  name:       { type: String, required: true },
  totalValue: { type: Number, required: true },
  totalCost:  { type: Number, required: true },
  currency:   { type: String, default: "SAR" },
  period:     { type: String, required: true },          // "2025-06"
  status:     { type: String, enum: ["active", "completed", "cancelled"], default: "active" },
}, { timestamps: true });
```

### 5.3 Invoices

```typescript
// lib/db/src/schema/aissol/invoices.ts

const AissolInvoiceSchema = new Schema({
  workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
  projectId:   { type: Schema.Types.ObjectId, ref: "AissolProject", required: true },
  repId:       { type: Schema.Types.ObjectId, ref: "Rep", required: true },
  invoiceNumber: { type: String, required: true },
  amount:      { type: Number, required: true },
  currency:    { type: String, default: "SAR" },
  period:      { type: String, required: true },
}, { timestamps: true });
```

### 5.4 Export from aissol/index.ts

```typescript
export const AissolCommissionMatrix = model("AissolCommissionMatrix", AissolCommissionMatrixSchema);
export const AissolProject = model("AissolProject", AissolProjectSchema);
export const AissolInvoice = model("AissolInvoice", AissolInvoiceSchema);
```

Note: These are **not** exported from `lib/db/src/schema/index.ts`. They live in their own barrel file so only the AISSOL engine imports them.

---

## 6. CommissionResult Extension

Add an optional `meta` field to the existing `CommissionResultSchema` so engines can store engine-specific metadata without polluting the schema. This is the only change to an existing model:

```typescript
// lib/db/src/schema/commissionRuns.ts — add to CommissionResultSchema:
meta: { type: Schema.Types.Mixed },
```

This is backward-compatible (optional, defaults to undefined). Existing results are unaffected.

---

## 7. Calc Worker Changes

The worker becomes a thin dispatcher. Only lines 129-358 of `calc-worker.ts` change — the job handler is replaced:

```typescript
// artifacts/api/src/workers/calc-worker.ts (new job handler, replaces lines 129-358)

async (job) => {
  const { workspaceId, runId, period } = job.data;
  const { connectDB, CommissionRun, CommissionResult, Workspace } = await import("@workspace/db");
  await connectDB();

  const run = await CommissionRun.findById(runId);
  if (!run) throw new Error("Run not found");

  try {
    await CommissionRun.findByIdAndUpdate(runId, { status: "processing" });

    // ---- NEW: Engine dispatch ----
    const workspace = await Workspace.findById(workspaceId);
    const engineName = (workspace as any)?.commissionEngine || "standard";
    const engine = getEngine(engineName);

    const wsCurrency = (workspace as any)?.currency || "USD";
    const output = await engine.calculate({
      workspaceId,
      runId,
      period,
      paymentStatuses: job.data.paymentStatuses,
      wsCurrency,
    });
    // ---- End engine dispatch ----

    // Save results (unchanged from existing code)
    await CommissionResult.deleteMany({ runId: run._id });
    if (output.results.length > 0) {
      await CommissionResult.insertMany(output.results);
    }

    await CommissionRun.findByIdAndUpdate(runId, {
      totalCommission: output.summary.totalCommission,
      totalDeals: output.summary.totalItems,
      skippedDeals: output.summary.skippedItems,
      repsCount: output.summary.involvedReps.size,
      status: "completed",
      error: null,
    });

    // Notify admins (unchanged, same email/notification logic)
    // ...
  } catch (err: any) {
    await CommissionRun.findByIdAndUpdate(runId, {
      status: "failed",
      error: err.message || "Unknown error",
    });
    throw err;
  }
}
```

---

## 8. API Routes

### 8.1 Enterprise Routes Mounting

```typescript
// artifacts/api/src/routes/enterprise/index.ts

import { Router } from "express";
import { Workspace } from "@workspace/db";
import { requireAuth, type AuthenticatedRequest } from "../../middleware/auth";

const router = Router();

// Middleware: only mount enterprise routes if workspace uses that engine
router.use(async (req: AuthenticatedRequest, res, next) => {
  const workspaceId = req.headers["x-workspace-id"] as string;
  if (!workspaceId) {
    res.status(400).json({ error: "X-Workspace-ID required" });
    return;
  }

  const ws = await Workspace.findById(workspaceId);
  const engine = (ws as any)?.commissionEngine || "standard";

  // Attach engine name to request for downstream route handling
  (req as any).commissionEngine = engine;

  // Mount AISSOL routes only for AISSOL workspaces
  if (engine === "aissol") {
    const { aissolRouter } = await import("./aissol/routes");
    aissolRouter(req, res, next);
  } else {
    res.status(404).json({ error: "No enterprise features for this workspace" });
  }
});

export default router;
```

### 8.2 AISSOL-Specific Routes

```typescript
// artifacts/api/src/routes/enterprise/aissol/routes.ts
// CRUD for: Projects, Invoices, Commission Matrix

GET    /api/enterprise/projects            # List projects for workspace
POST   /api/enterprise/projects            # Create project
GET    /api/enterprise/projects/:id        # Get project with invoices
PUT    /api/enterprise/projects/:id        # Update project
DELETE /api/enterprise/projects/:id        # Delete project

GET    /api/enterprise/projects/:id/invoices     # List invoices for project
POST   /api/enterprise/projects/:id/invoices     # Add invoice to project
DELETE /api/enterprise/projects/:id/invoices/:iid

GET    /api/enterprise/commission-matrix          # Get matrix for workspace
PUT    /api/enterprise/commission-matrix          # Set/update matrix values
```

### 8.3 Mount in Route Index

```typescript
// artifacts/api/src/routes/index.ts — add:
import enterpriseRouter from "./enterprise";
router.use("/enterprise", enterpriseRouter);
```

---

## 9. Workspace Configuration

### 9.1 Workspace Model Extension

```typescript
// lib/db/src/schema/workspaces.ts — add to WorkspaceSchema:
commissionEngine: { type: String, default: "standard" },
```

### 9.2 Settings Endpoint

Add `commissionEngine` to the existing workspace settings GET/PATCH endpoints (or create new `/workspaces/:id/settings` routes). The frontend already calls this endpoint.

```typescript
// In workspace settings GET response, add:
commissionEngine: workspace.commissionEngine || "standard",

// In workspace settings PATCH, accept:
const { commissionEngine } = body;
if (commissionEngine) {
  workspace.commissionEngine = commissionEngine;
}
```

### 9.3 Frontend Settings Page

Add an engine selector to the workspace settings tab. Only visible to workspace owners/admins. Uses a `<Select>` dropdown:

```
┌─────────────────────────────────────────┐
│ Commission Engine                       │
│ ┌─────────────────────────────────────┐│
│ │ Standard (Flat / Tiered / Accel.)  ▾││
│ │ AISSOL (Slabs + Matrix)             ││
│ └─────────────────────────────────────┘│
│ ⚠ Changing engine may require         │
│   different data setup.               │
└─────────────────────────────────────────┘
```

---

## 10. Frontend Conditional Rendering

The frontend sees which engine is active from the workspace object:

```typescript
// In use-workspace.tsx, add to Workspace interface:
commissionEngine: string;

// In sidebar or nav:
{activeWorkspace?.commissionEngine === "aissol" && (
  <>
    <SidebarItem href="/dash/enterprise/projects" label="Projects" />
    <SidebarItem href="/dash/enterprise/commission-matrix" label="Matrix" />
  </>
)}
```

AISSOL frontend pages live in `artifacts/web/src/pages/enterprise/aissol/`.

---

## 11. Startup Bootstrap

```typescript
// artifacts/api/src/index.ts — add after connectDB():
import { bootstrapEngines } from "./workers/engines/registry";
await bootstrapEngines();
```

---

## 12. Migration / Rollout Plan

### Phase 0: Foundation (1 PR, no user-facing changes)
1. Add `commissionEngine` field to Workspace model (defaults to `"standard"`)
2. Create the `CalcEngine` interface and registry
3. Refactor existing calc logic into `StandardEngine`
4. Update `calc-worker.ts` to dispatch via registry

**Verification**: All existing tests pass. No behavior change.

### Phase 1: AISSOL Engine (1 PR per layer)
1. Create AISSOL DB models
2. Implement `AissolEngine` class
3. Add AISSOL API routes
4. Add frontend pages (projects, invoices, matrix config)

### Phase 2: Go Live (configuration only)
1. Set `commissionEngine: "aissol"` on the AISSOL workspace
2. Import their project/invoice data
3. Configure the commission matrix

---

## 13. Adding a New Enterprise Customer

```bash
# 1. Create the engine file
touch artifacts/api/src/workers/engines/acme-corp.engine.ts

# 2. Implement the CalcEngine interface
# 3. Register in registry.ts:
#    registerEngine(new AcmeCorpEngine());

# 4. If new data models needed:
mkdir lib/db/src/schema/acme-corp/
#    ... models here

# 5. If new routes needed:
mkdir artifacts/api/src/routes/enterprise/acme-corp/
#    ... routes here

# 6. Add to enterprise/index.ts conditional mounting

# 7. Set workspace.commissionEngine = "acme-corp"
```

Each enterprise customer is **one engine file + optional models/routes**. Nothing else in the codebase needs to change.

---

## 14. Isolation Guarantees

| Concern | How It's Handled |
|---|---|
| **Data isolation** | Enterprise models are separate collections, only loaded by that engine |
| **Code isolation** | Each engine is a self-contained class in its own file |
| **No branch conflicts** | Everything is additive. Standard engine is untouched |
| **No cross-contamination** | Standard workspaces never import enterprise code (lazy imports via registry) |
| **DB migrations** | New collections are separate. Existing collections get only backward-compatible additions (e.g., `meta` field) |
| **API pollution** | Enterprise routes only mount for matching workspaces |
| **UI pollution** | Enterprise nav items only render for matching workspaces |
| **Safe rollback** | Setting `commissionEngine` back to `"standard"` is a single DB field update |
