# Salesforce CRM Connector

## Overview

The Salesforce connector integrates CommissionKit with Salesforce Sales Cloud. It syncs **Users as reps** and **Opportunities as deals**. Salesforce is the most widely-used CRM, so this connector is a priority for enterprise adoption.

Authentication is token-based — a Connected App access token, or a Security Token + password. Passed as `Authorization: Bearer {token}` to the Salesforce REST API.

---

## REST API Summary

### Base URL

Salesforce provides an instance URL after authentication:

```
https://{instance}.salesforce.com/services/data/v58.0
```

The instance URL is returned in the OAuth token response or can be constructed from `https://login.salesforce.com` for production orgs.

### Authentication

Two options:

**Option 1: Access Token (recommended)**
Create a Connected App in Salesforce Setup → copy the Consumer Key and Consumer Secret → use the Username-Password OAuth flow to get an access token. Token goes in the header: `Authorization: Bearer {accessToken}`.

**Option 2: Security Token + Password**
Classic API auth using username, password, and security token. Salesforce generates a security token that appends to the password. Not recommended but supported.

For CKit, the simplest UX: a single **Access Token** field (same pattern as HubSpot). The user gets the token from their Connected App or from Setup → My Personal Information → Reset Security Token.

### SOQL Queries (Salesforce's SQL dialect)

Salesforce uses SOQL via the Query resource:

```
GET /services/data/v58.0/query/?q={encoded SOQL}
```

### Key Objects

| Object | What | CKit |
|---|---|---|
| `User` (SOQL) | Users with Profile = Sales | Reps |
| `Opportunity` (SOQL) | Deals | Deals |
| `Lead` | Prospects | Not synced |
| `Account` | Companies | Not synced |

### Users/Reps

```
GET /services/data/v58.0/query/?q=SELECT+Id,Name,Email,UserRole.Name+FROM+User+WHERE+IsActive=true
```

Response shape:
```json
{
  "records": [
    {
      "Id": "0055e00000ABC123",
      "Name": "John Doe",
      "Email": "john.doe@company.com",
      "attributes": { "type": "User" }
    }
  ],
  "totalSize": 1,
  "done": true,
  "nextRecordsUrl": null
}
```

### Opportunities/Deals

```
GET /services/data/v58.0/query/?q=SELECT+Id,Name,Amount,CloseDate,StageName,OwnerId,CurrencyIsoCode,Description+FROM+Opportunity+WHERE+StageName+IN+('Closed Won')
```

Key opportunity fields:
- `Id` — unique 15/18 char ID
- `Name` — opportunity name
- `Amount` — deal amount
- `CloseDate` — when the deal closed
- `StageName` — stage label (e.g., "Prospecting", "Closed Won", "Closed Lost")
- `OwnerId` — Salesforce User ID (links to rep)
- `CurrencyIsoCode` — ISO currency code
- `Description` — notes

SOQL filtering by stage:
- `WHERE StageName = 'Closed Won'` — only won deals
- `WHERE StageName IN ('Closed Won', 'Closed Lost')` — both
- `WHERE IsClosed = true` — any closed deal

Response shape:
```json
{
  "records": [
    {
      "Id": "0065e00000XYZ789",
      "Name": "Enterprise Deal — Acme Corp",
      "Amount": 999000,
      "CloseDate": "2024-03-15",
      "StageName": "Closed Won",
      "OwnerId": "0055e00000ABC123",
      "CurrencyIsoCode": "USD",
      "Description": "Q3 expansion deal",
      "attributes": { "type": "Opportunity" }
    }
  ],
  "totalSize": 1,
  "done": true,
  "nextRecordsUrl": null
}
```

### Pagination

Salesforce REST API uses cursor-based pagination:

```
GET /query/... → response includes `nextRecordsUrl: "/services/data/v58.0/query/01g5e00000XYZ-200"`
GET /services/data/v58.0/query/01g5e00000XYZ-200 → next page
```

The connector follows `nextRecordsUrl` until `done: true`.

### Stage Discovery

Salesforce stages are configured per org. Users can:
1. Auto-discover: `SELECT MasterLabel, IsWon, IsClosed FROM OpportunityStage WHERE IsActive = true` returns all pipeline stages
2. Custom mapping: via Stage Mapping UI (same pattern as HubSpot)

Default stage mapping:

| StageName | IsClosed? | CKit stage |
|---|---|---|
| Prospecting | No | `pending` |
| Qualification | No | `pending` |
| Negotiation | No | `pending` |
| Closed Won | Yes (IsWon=true) | `closed_won` |
| Closed Lost | Yes (IsWon=false) | `closed_lost` |

---

## Implementation Plan

### Files

```
plugins/salesforce/
├── package.json       # workspace config
├── tsconfig.json      # TypeScript config
├── src/
│   ├── index.ts       # exports SalesforceConnector
│   ├── connector.ts   # SalesforceConnector extends BasePlugin
│   └── client.ts      # Salesforce REST API client (SOQL + pagination)
```

### Connector (`connector.ts`)

```typescript
export class SalesforceConnector extends BasePlugin {
  readonly name = "salesforce";
  readonly displayName = "Salesforce CRM";
  readonly version = "1.0.0";

  // Config: { accessToken, instanceUrl, syncClosedOnly? }
  
  async fetchReps(ws, config): NormalizedRep[] {
    // SOQL: SELECT Id,Name,Email FROM User WHERE IsActive=true
    // Map: Id → externalId, Name → name, Email → email
  }

  async fetchDeals(ws, config): NormalizedDeal[] {
    // SOQL: SELECT Id,Name,Amount,CloseDate,StageName,OwnerId,CurrencyIsoCode FROM Opportunity
    // Filter by IsWon=true for syncClosedOnly
    // Map: Id → externalId, Amount → amount, CloseDate → date, etc.
  }
}
```

### Client (`client.ts`)

```typescript
export class SalesforceClient {
  constructor(accessToken: string, instanceUrl: string) {}

  async query<T>(soql: string): Promise<T[]> {
    // GET /services/data/v58.0/query/?q={encoded soql}
    // Follow nextRecordsUrl for pagination
  }
}
```

### Auth Flow in UI

Connect dialog shows two fields:
- **Instance URL** — `https://yourinstance.my.salesforce.com`
- **Access Token** — obtained from Connected App or Setup

Click Connect → test credentials → save connection.

### Stage Discovery

On connection, auto-discover opportunity stages:
```sql
SELECT MasterLabel, IsWon, IsClosed FROM OpportunityStage WHERE IsActive=true
```

Auto-map IsWon=true → `closed_won`, IsClosed && !IsWon → `closed_lost`, others → `pending`.

Users can customize via Stage Mapping dialog (same as HubSpot).

---

## Sync Behavior

- Fetches active Users (IsActive=true) as reps
- Fetches opportunities filtered by IsWon=true by default (configurable)
- Follows `nextRecordsUrl` cursor pagination
- Deals without OwnerId are filtered out
- Stage names are normalized to CKit stages
- Stage mapping saved to metadata for overrides

---

## What's NOT in v1

- Webhooks (Salesforce Outbound Messages / Change Data Capture)
- Write-back (commission → opportunity custom fields like `Commission_Amount__c`)
- Lead/Account sync
- Sandbox vs Production detection (just use the instance URL provided)
- Record-level sharing/visibility (inherits from the authenticating user's permissions)
