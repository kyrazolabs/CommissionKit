# CommissionKit Plugins

## Vision

CommissionKit becomes the **universal commission engine** that sits on top of any ERP or CRM — not competing with Odoo, HubSpot, Salesforce, Zoho, or Dynamics, but **integrating with them** as the commission layer they all lack.

> "Your ERP manages the business. CommissionKit manages the commissions."

---

## Index

| Document | Purpose |
|---|---|
| [architecture.md](./architecture.md) | Technical architecture overview — how plugins connect, sync, and operate |
| [data-mapping.md](./data-mapping.md) | How ERP/CRM entities map to CommissionKit entities |
| [connector-sdk.md](./connector-sdk.md) | Plugin SDK interface specification — what every connector must implement |
| [sync-engine.md](./sync-engine.md) | Bidirectional sync engine design — webhooks, polling, conflict resolution |
| [api-design.md](./api-design.md) | New API endpoints and models required for the plugin system |
| [odoo-connector.md](./odoo-connector.md) | Odoo ERP connector implementation plan |
| [hubspot-connector.md](./hubspot-connector.md) | HubSpot CRM connector implementation plan |
| [custom-connector.md](./custom-connector.md) | Generic REST connector for custom ERPs and CRMs |
| [implementation-plan.md](./implementation-plan.md) | Phased implementation roadmap with milestones |

---

## The Core Idea in One Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        ERP / CRM Systems                         │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │   Odoo   │  │ HubSpot  │  │Salesforce│  │   Zoho   │  ...   │
│  │   ERP    │  │   CRM    │  │   CRM    │  │   CRM    │        │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘        │
│       │              │              │              │              │
│       │    Deals     │     Deals    │  Opportunities│            │
│       │    Reps      │    Contacts  │   Users      │            │
│       │    Invoices  │   Companies  │   Accounts   │            │
│       │    Payments  │              │              │            │
│       └──────────────┴──────────────┴──────────────┘            │
│                          │                                       │
│                    Sync via Plugin Connectors                    │
│                          │                                       │
└──────────────────────────┼───────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                     CommissionKit Layer                           │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  Sync Engine  │  │ Commission   │  │  Payouts, Disputes,  │   │
│  │  (ingress)    │──│ Plans & Calc │──│  Reports, Portal     │   │
│  │               │  │ Engine       │  │  (egress)            │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │              Plugin Connection Registry                       │ │
│  │  Workspace A → Odoo connector (REST + webhooks)              │ │
│  │  Workspace B → HubSpot connector (OAuth + webhooks)          │ │
│  │  Workspace C → Generic REST connector (custom ERP)           │ │
│  └──────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

---

## Key Design Principles

1. **CommissionKit is the source of truth for commissions.** The ERP remains the source of truth for deals, reps, invoices, and payments. The plugin syncs data **into** CommissionKit; calculations, payouts, and disputes happen inside CommissionKit.

2. **Read-only ingress, write-back egress.** Data flows into CommissionKit (reps, deals, invoices). Commission results flow back to the ERP (optional — configurable per connector).

3. **One workspace, one connector.** Each workspace connects to exactly one ERP/CRM instance. Switching connectors for a workspace is a deliberate migration.

4. **Pluggable by design.** Every connector implements the same TypeScript interface. Adding a new ERP is just implementing the interface — zero changes to core CommissionKit logic.

5. **Graceful degradation.** If the ERP is unreachable, CommissionKit continues operating on the last-synced data. Stale data warnings are surfaced in the UI.

6. **Sync is async.** All sync operations go through BullMQ queues. The API responds immediately; sync happens in the background.
