# Oracle CX CRM Connector

## Overview

The Oracle connector integrates CommissionKit with Oracle Fusion Cloud CX (Sales). It syncs **salespersons as reps** and **opportunities as deals**. Oracle CX is a CRM, so opportunities are the primary deal entity.

Authentication is **Basic Auth** (username + password) against the Oracle REST API. Oracle CX REST APIs are available on all Oracle Fusion Cloud instances with the Sales module enabled.

---

## REST API Summary

### Base URL

```
https://{host}/crmRestApi/resources/latest
```

### Authentication

Basic Auth — `Authorization: Basic base64(user:pass)`. Oracle CX supports this natively for REST API access. The user account must have the **Sales Administrator** or **Sales Representative** role with API access.

### Key Resources

| Resource | What | CKit equivalent |
|---|---|---|
| `/salesPersons` | Sales team members | Reps |
| `/opportunities` | Opportunities/deals | Deals |

### Sales Persons (`/salesPersons`)

```
GET /crmRestApi/resources/latest/salesPersons?limit=100&offset=0
```

Response shape:
```json
{
  "items": [
    {
      "PartyNumber": "1001",
      "PersonFirstName": "John",
      "PersonLastName": "Doe",
      "EmailAddress": "john.doe@company.com",
      "SalesPersonNumber": "SP-001",
      "StatusCode": "ACTIVE"
    }
  ],
  "count": 1,
  "hasMore": false,
  "offset": 0
}
```

### Opportunities (`/opportunities`)

```
GET /crmRestApi/resources/latest/opportunities?limit=100&offset=0&q=StatusCode=WON
```

Key opportunity fields:
- `OptyNumber` — unique ID
- `Name` — opportunity name
- `Revenue` — deal amount (in the currency of the opportunity)
- `StatusCode` — stage: `DRAFT`, `IN_PROGRESS`, `WON`, `LOST`
- `SalesPersonNumber` — links to sales person
- `CurrencyCode` — ISO currency
- `ActualCloseDate` — when the deal closed
- `Description` — notes

Response shape:
```json
{
  "items": [
    {
      "OptyNumber": "OPT-2024-001",
      "Name": "Enterprise Deal — Acme Corp",
      "Revenue": 999000,
      "StatusCode": "WON",
      "SalesPersonNumber": "SP-001",
      "CurrencyCode": "USD",
      "ActualCloseDate": "2024-03-15",
      "Description": "Q3 enterprise expansion"
    }
  ],
  "count": 1,
  "hasMore": false,
  "offset": 0
}
```

### Pagination

Oracle CX uses offset pagination:

```
GET /crmRestApi/resources/latest/{resource}?limit=100&offset=0
```

Response includes:
- `hasMore: boolean` — whether there are more records
- `count: number` — total records in current page
- `offset: number` — current offset

### Stage Mapping

| Oracle StatusCode | CKit stage |
|---|---|
| `DRAFT` | `pending` |
| `IN_PROGRESS` | `pending` |
| `WON` | `closed_won` |
| `LOST` | `closed_lost` |

### Filtering (OData-style queries)

Oracle CX supports filtering via URL query parameters:
- `q=StatusCode=WON` — only WON opportunities
- `q=StatusCode!=LOST` — exclude LOST
- Multiple: `q=StatusCode=WON;CurrencyCode=USD`

The connector will use `q=StatusCode=WON` by default for `syncClosedOnly: true`.

---

## Implementation Plan

### Files

```
plugins/oracle/
├── package.json       # workspace config
├── tsconfig.json      # TypeScript config
├── src/
│   ├── index.ts       # exports OracleConnector
│   ├── connector.ts   # OracleConnector extends BasePlugin
│   └── client.ts      # Oracle REST API client
```

### Connector (`connector.ts`)

```typescript
export class OracleConnector extends BasePlugin {
  readonly name = "oracle";
  readonly displayName = "Oracle CX";
  readonly version = "1.0.0";

  // Config: { baseUrl, username, password, syncClosedOnly? }
  
  async fetchReps(ws, config): NormalizedRep[] {
    // GET /salesPersons?limit=100
    // Map: PartyNumber → externalId, PersonFirstName+LastName → name, EmailAddress → email
  }

  async fetchDeals(ws, config): NormalizedDeal[] {
    // GET /opportunities?q=StatusCode=WON&limit=100
    // Map: OptyNumber → externalId, Revenue → amount, StatusCode → stage, etc.
  }
}
```

### Client (`client.ts`)

```typescript
export class OracleClient {
  constructor(baseUrl: string, username: string, password: string) {}
  
  async get<T>(path: string, params?: Record<string, string>): Promise<T> {
    // Basic Auth header + offset pagination with hasMore
  }
}
```

### Auth Flow in UI

Connect dialog shows three fields:
- **Instance URL** — `https://myinstance.oraclecloud.com`
- **Username** — Oracle CX user with API access
- **Password** — user's password

Click Connect → test the credentials → save connection.

---

## Sync Behavior

- Fetches all active sales persons (no filter needed — `StatusCode=ACTIVE` is default)
- Fetches only WON opportunities by default (`q=StatusCode=WON`)
- Offset pagination: reads `hasMore` to determine if more pages exist
- Stage mapping: custom map saved to metadata (like HubSpot stage mapping)
- Deals without SalesPersonNumber are filtered out

---

## What's NOT in v1

- Webhooks (Oracle CX webhooks/callbacks)
- Write-back (commission → opportunity custom fields)
- Lead/opportunity conversion tracking
- Activity/task sync
- Oracle NetSuite (different product)
