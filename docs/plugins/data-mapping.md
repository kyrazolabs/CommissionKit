# Data Mapping: ERP/CRM → CommissionKit

This document defines how entities from various ERP/CRM systems map to CommissionKit entities, and which fields are synced in each direction.

---

## Entity Mapping Overview

| CommissionKit Entity | Odoo ERP | HubSpot CRM | Salesforce CRM | Zoho CRM | Dynamics 365 | Generic REST |
|---|---|---|---|---|---|---|---|
| **Rep** | `res.users` (salespersons) | Owner | User (sales reps) | SalesPersons | SystemUser (salesperson role) | Configurable |
| **Deal** | `sale.order` (confirmed) | Deal | Opportunity (closed-won) | Deal (closed-won) | Opportunity (won) | Configurable |

**That's it for the standard connector.** Reps and Deals are the only data synced. The standard engine works with these two entities to calculate commissions (flat, tiered, accelerator).

**Enterprise engine (AISSOL) additionally maps**:

| CommissionKit Entity | Odoo ERP | Dynamics 365 | Generic REST |
|---|---|---|---|
| **Project** | `project.project` | Project | Configurable |
| **Invoice** | `account.move` (customer invoice) | Invoice | Configurable |

CRM platforms (HubSpot, Salesforce, Zoho) only have Deals/Opportunities — they sync Reps + Deals and nothing else.

---

## Rep Mapping

| CKit Field | Odoo | HubSpot | Salesforce | Generic |
|---|---|---|---|---|
| `name` | `res.users.name` or `hr.employee.name` | `properties.firstname` + `properties.lastname` | `User.Name` | `name` (configurable) |
| `email` | `res.users.email` | `properties.email` | `User.Email` | `email` (configurable) |
| `role` | `job_id.name` | `jobtitle` | `User.UserRole.Name` | `role` (configurable) |
| `externalId` | `res.users.id` | `contact.id` | `User.Id` | `id` (configurable) |
| `planId` | — (assigned in CKit) | — (assigned in CKit) | — (assigned in CKit) | — (assigned in CKit) |

**Post-sync actions**:
1. Generate `portalAccessCode` (unique 12-char code) if new
2. Generate `portalUsername` if new
3. Create Better Auth user for portal access (if `PORTAL_ENABLED`)
4. Send portal welcome email (optional, configurable)
5. Auto-assign default plan if workspace has `autoAssignPlanId` set

---

## Deal Mapping

| CKit Field | Odoo | HubSpot | Salesforce | Generic |
|---|---|---|---|---|
| `name` | `sale.order.name` | `properties.dealname` | `Opportunity.Name` | `name` |
| `amount` | `sale.order.amount_total` | `properties.amount` | `Opportunity.Amount` | `amount` |
| `closeDate` | `sale.order.date_order` | `properties.closedate` | `Opportunity.CloseDate` | `closeDate` |
| `stage` | Derived: `state` (draft→sent→sale→done) | `properties.dealstage` | `Opportunity.StageName` | `stage` |
| `currency` | `sale.order.currency_id.name` | `properties.deal_currency_code` | `Opportunity.CurrencyIsoCode` | `currency` |
| `paymentStatus` | Derived: invoice payment state | — (manual in CKit) | — (manual in CKit) | `paymentStatus` |
| `notes` | `sale.order.note` | `properties.description` | `Opportunity.Description` | `notes` |
| `repId` | `sale.order.user_id` → matched by externalId | `properties.hubspot_owner_id` → matched by externalId | `Opportunity.OwnerId` → matched by externalId | `repId` |
| `externalId` | `sale.order.id` | `deal.id` | `Opportunity.Id` | `id` |
| `period` | Derived: `YYYY-MM` from `closeDate` | Same | Same | Same |

**Deal Stage Mapping** (CKit only cares about closed-won):
- Odoo: `sale.order` with `state = 'sale'` or `'done'` → "closed-won"
- HubSpot: `dealstage` in the "Closed Won" category → "closed-won"
- Salesforce: `StageName = 'Closed Won'` → "closed-won"
- Zoho: `Stage = 'Closed Won'` → "closed-won"

**Stage filtering**: By default, only closed-won deals are synced (non-closed deals are not commissionable). Configurable per connector to include all stages for pipeline visibility.

**Currency handling**:
- ERP deal currency is synced as-is to `Deal.currency`
- Commission calculation converts to workspace currency using historical exchange rates
- Currency code crosswalk: Odoo currency names → ISO 4217 codes

---

## Project Mapping (Enterprise / AISSOL Engine Only)

> **Not part of the standard connector.** The Odoo connector syncs only Reps and Deals. Project/Invoice mapping applies exclusively to enterprise engine workspaces using the AISSOL engine. These connectors are separate from the standard Reps + Deals sync.

| CKit Field | Odoo | Dynamics 365 | Generic |
|---|---|---|---|
| `name` | `project.project.name` | `msdyn_project.name` | `name` |
| `totalValue` | `project.project.total_planned_amount` or sum of `sale.order` linked | Revenue budget | `totalValue` |
| `totalCost` | Sum of `account.analytic.line` costs | Cost budget | `totalCost` |
| `currency` | `project.project.currency_id.name` | `transactioncurrencyid.isocurrencycode` | `currency` |
| `period` | Derived from project date range | Same | `period` |
| `status` | Mapped: template→draft, normal→active, done→completed, cancelled→cancelled | Statecode mapping | `status` |
| `repId` | `project.project.user_id` → matched by externalId | `msdyn_project.ownerid` | `repId` |
| `externalId` | `project.project.id` | `msdyn_project.msdyn_projectid` | `id` |

---

## Invoice Mapping (Enterprise / AISSOL Engine Only)

> **Not part of the standard connector.** Same as above — enterprise engine only.

| CKit Field | Odoo | Dynamics 365 | Generic |
|---|---|---|---|
| `invoiceNumber` | `account.move.name` | `invoice.invoicenumber` | `invoiceNumber` |
| `amount` | `account.move.amount_total` | `invoice.totalamount` | `amount` |
| `currency` | `account.move.currency_id.name` | Transaction currency | `currency` |
| `period` | Derived from `account.move.invoice_date` | Same | `period` |
| `paymentStatus` | `account.move.payment_state` (paid/partial/unpaid/reversed) | Status code mapping | `paymentStatus` |
| `dueDate` | `account.move.invoice_date_due` | `invoice.duedate` | `dueDate` |
| `notes` | `account.move.narration` | `invoice.description` | `notes` |
| `projectId` | `account.move.line` → `analytic_distribution` → project | Lookup | `projectId` |
| `repId` | `account.move.invoice_user_id` → matched by externalId | `invoice.ownerid` | `repId` |
| `externalId` | `account.move.id` | `invoice.invoiceid` | `id` |

---

## Payment Status Mapping

**For the standard Odoo connector**, payment status is read directly from `sale.order.invoice_status` — no separate payment sync needed:

| CKit Status | Odoo `sale.order.invoice_status` |
|---|---|
| `unpaid` | `to_invoice`, `no` |
| `partial` | `invoiced`, `partial` |
| `paid` | `fully_paid`, `paid` |

**CLawback automation**: When a deal's `paymentStatus` changes from `paid` to `unpaid` (refunded, charged back), the sync engine triggers clawback enforcement — existing commission run results for that deal are flagged, and the next run recalculates accordingly.

---

## Bidirectional Sync Matrix

| Data | Owned By | Sync Direction |
|---|---|---|
| Rep name, email, role | ERP | ERP → CKit |
| Deal amount, closeDate, stage, currency | ERP | ERP → CKit |
| Deal paymentStatus | ERP | ERP → CKit (from `sale.order.invoice_status` in Odoo) |
| Commission plan assignment | CKit | — (manual in CKit) |
| Commission calculation results | CKit | CKit → ERP (optional write-back) |
| Payout status | CKit | CKit → ERP (optional write-back) |
| Dispute state | CKit | CKit → ERP (optional write-back) |
| Portal access codes | CKit | — (generated in CKit) |

---

## Custom Field Mapping (Generic REST Connector)

For the generic REST connector, field mappings are configured via a JSON schema:

```json
{
  "reps": {
    "endpoint": "/api/v1/users?role=sales",
    "responsePath": "data",
    "fields": {
      "name": "fullName",
      "email": "emailAddress",
      "role": "jobTitle",
      "externalId": "id"
    }
  },
  "deals": {
    "endpoint": "/api/v1/orders?status=confirmed",
    "responsePath": "results",
    "fields": {
      "name": "orderNumber",
      "amount": "totalAmount",
      "closeDate": "confirmationDate",
      "stage": "orderStatus",
      "currency": "currencyCode",
      "repId": "salesRep.id",
      "externalId": "id"
    },
    "stageFilter": {
      "field": "orderStatus",
      "include": ["confirmed", "delivered"]
    }
  }
}
```

The generic connector uses JSONPath notation (`salesRep.id`) to navigate nested objects during transformation.

---

## Deduplication & Matching

### Primary Match Key

Every entity uses the compound key: `{ workspaceId, sourceSystem, externalId }`

This is enforced by a unique compound index in MongoDB.

### Alternatives (for ERPs without stable IDs)

1. **Natural key**: For systems where IDs change (e.g., import/export cycles), a configurable alternative key can be used:
   - Rep: `email`
   - Deal: `name + closeDate + amount + repId`
   - Invoice: `invoiceNumber + projectId`

2. **Fuzzy matching**: For ERPs that don't provide external IDs, hash-based matching on a configurable set of fields.

### Conflict Scenario Resolution

| Scenario | Strategy |
|---|---|
| ERP entity deleted → CKit entity exists | Soft-delete in CKit (mark `deletedFromSource: true`). Don't hard-delete — preserve commission history. |
| ERP entity re-created with same externalId | Reactivate CKit entity, re-sync fields |
| Two ERPs push the same deal | Prevented by `sourceSystem` in the compound key — each deal is scoped to one connector |
| Workspace switches connector | Migration UI: map old externalIds to new externalIds, or full re-import. Old data preserved as-is. |

---

## Data Added to ERPs (Write-Back)

When write-back is enabled, CommissionKit adds the following to the ERP:

### Odoo

CKit creates custom fields on `sale.order`:
- `x_ckit_commission_amount` (float) — Total commission on this deal
- `x_ckit_commission_rate` (float) — Rate applied
- `x_ckit_payout_status` (char) — Current payout status
- `x_ckit_payout_amount` (float) — Final payout amount
- `x_ckit_dispute` (boolean) — Whether a dispute exists

### HubSpot

CKit creates custom properties on Deal objects:
- `ckit_commission_amount` (number)
- `ckit_commission_rate` (number)
- `ckit_payout_status` (single-line text)
- `ckit_dispute` (single-line text — link to dispute)

### Salesforce

CKit creates custom fields on Opportunity:
- `CKit_Commission_Amount__c` (Currency)
- `CKit_Commission_Rate__c` (Percent)
- `CKit_Payout_Status__c` (Picklist)
- `CKit_Dispute__c` (URL)

### Generic REST

Configurable JSON schema defining which fields to write back and to which endpoint.
