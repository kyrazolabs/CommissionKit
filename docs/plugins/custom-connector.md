# Custom REST Connector

## Overview

The Custom REST connector allows CommissionKit to integrate with any ERP or CRM that exposes a REST API. It's a **config-driven connector** — no code changes needed. Users define field mappings, authentication, and endpoints via a JSON configuration.

---

## When to Use

- ERP/CRM not in the official connector list
- In-house/custom ERP systems
- Legacy systems with REST APIs
- Any system that can expose reps, deals, invoices, or projects as JSON

---

## Configuration Schema

```json
{
  "type": "object",
  "required": ["baseUrl", "auth", "entities"],
  "properties": {
    "baseUrl": {
      "type": "string",
      "title": "Base URL",
      "description": "Root URL of the ERP/CRM REST API",
      "format": "uri"
    },
    "auth": {
      "type": "object",
      "title": "Authentication",
      "oneOf": [
        {
          "title": "API Key Header",
          "properties": {
            "type": { "const": "apiKey" },
            "headerName": { "type": "string", "title": "Header Name", "default": "X-API-Key" },
            "apiKey": { "type": "string", "title": "API Key", "format": "password", "x-sensitive": true }
          }
        },
        {
          "title": "Bearer Token",
          "properties": {
            "type": { "const": "bearer" },
            "token": { "type": "string", "title": "Token", "format": "password", "x-sensitive": true }
          }
        },
        {
          "title": "Basic Auth",
          "properties": {
            "type": { "const": "basic" },
            "username": { "type": "string", "title": "Username" },
            "password": { "type": "string", "title": "Password", "format": "password", "x-sensitive": true }
          }
        },
        {
          "title": "OAuth 2.0 Client Credentials",
          "properties": {
            "type": { "const": "oauth2" },
            "tokenUrl": { "type": "string", "title": "Token URL" },
            "clientId": { "type": "string", "title": "Client ID" },
            "clientSecret": { "type": "string", "title": "Client Secret", "format": "password", "x-sensitive": true },
            "scopes": { "type": "string", "title": "Scopes" }
          }
        }
      ]
    },
    "entities": {
      "type": "object",
      "title": "Entity Mappings",
      "properties": {
        "reps": { "$ref": "#/definitions/entityMapping" },
        "deals": { "$ref": "#/definitions/entityMapping" }
      },
      "required": []
    },
    "pagination": {
      "type": "object",
      "title": "Pagination",
      "properties": {
        "type": {
          "type": "string",
          "enum": ["offset", "cursor", "page"],
          "title": "Pagination Type"
        },
        "limitParam": { "type": "string", "title": "Limit Parameter", "default": "limit" },
        "offsetParam": { "type": "string", "title": "Offset Parameter", "default": "offset" },
        "cursorParam": { "type": "string", "title": "Cursor Parameter", "default": "cursor" },
        "pageParam": { "type": "string", "title": "Page Parameter", "default": "page" },
        "limitValue": { "type": "number", "title": "Page Size", "default": 100 },
        "cursorPath": {
          "type": "string",
          "title": "Cursor Response JSONPath",
          "description": "JSONPath to the cursor/next-token in the response, e.g. 'meta.nextCursor'"
        }
      }
    },
    "responsePath": {
      "type": "string",
      "title": "Response Data JSONPath",
      "description": "JSONPath to the array of results in the response, e.g. 'data' or 'results.items'"
    }
  }
}
```

### Entity Mapping Schema

```json
{
  "definitions": {
    "entityMapping": {
      "type": "object",
      "properties": {
        "enabled": { "type": "boolean", "title": "Enable Sync", "default": false },
        "method": { "type": "string", "enum": ["GET", "POST"], "title": "HTTP Method", "default": "GET" },
        "endpoint": {
          "type": "string",
          "title": "Endpoint",
          "description": "API path, e.g. '/api/v1/sales-orders'"
        },
        "fields": {
          "type": "object",
          "title": "Field Mappings",
          "description": "Map CKit field names to JSONPaths in the response",
          "properties": {
            "externalId": { "type": "string", "title": "External ID", "default": "id" },
            "name": { "type": "string", "title": "Name" },
            "email": { "type": "string", "title": "Email" },
            "role": { "type": "string", "title": "Role" },
            "amount": { "type": "string", "title": "Amount" },
            "closeDate": { "type": "string", "title": "Close Date" },
            "stage": { "type": "string", "title": "Stage" },
            "currency": { "type": "string", "title": "Currency" },
            "repExternalId": { "type": "string", "title": "Rep External ID" },
            "paymentStatus": { "type": "string", "title": "Payment Status" },
            "notes": { "type": "string", "title": "Notes" }
          }
        },
        "filters": {
          "type": "array",
          "title": "Static Filters",
          "description": "Query parameters added to every request",
          "items": {
            "type": "object",
            "properties": {
              "key": { "type": "string" },
              "value": { "type": "string" }
            }
          }
        },
        "modifiedAfterParam": {
          "type": "string",
          "title": "Modified After Parameter",
          "description": "Query param for incremental sync, e.g. 'updated_since'"
        },
        "stageFilter": {
          "type": "object",
          "title": "Stage Filter",
          "description": "Only sync records with these stage values",
          "properties": {
            "field": { "type": "string", "title": "Field Path" },
            "include": { "type": "array", "items": { "type": "string" } }
          }
        },
        "currencyMapping": {
          "type": "object",
          "title": "Currency Mapping",
          "description": "Map custom currency codes to ISO 4217",
          "additionalProperties": { "type": "string" }
        },
        "paymentStatusMapping": {
          "type": "object",
          "title": "Payment Status Mapping",
          "description": "Map custom status strings to CKit PaymentStatus",
          "properties": {
            "paid": { "type": "array", "items": { "type": "string" } },
            "unpaid": { "type": "array", "items": { "type": "string" } },
            "partial": { "type": "array", "items": { "type": "string" } },
            "on_hold": { "type": "array", "items": { "type": "string" } }
          }
        }
      }
    }
  }
}
```

---

## Example Configurations

### Example 1: Simple Custom CRM

```json
{
  "baseUrl": "https://mycrm.example.com",
  "auth": {
    "type": "bearer",
    "token": "sk-abc123"
  },
  "pagination": {
    "type": "offset",
    "limitParam": "limit",
    "offsetParam": "offset",
    "limitValue": 100
  },
  "responsePath": "data",
  "entities": {
    "reps": {
      "enabled": true,
      "endpoint": "/api/v1/users",
      "fields": {
        "externalId": "id",
        "name": "fullName",
        "email": "emailAddress",
        "role": "jobTitle"
      },
      "filters": [
        { "key": "department", "value": "sales" },
        { "key": "active", "value": "true" }
      ]
    },
    "deals": {
      "enabled": true,
      "endpoint": "/api/v1/orders",
      "fields": {
        "externalId": "id",
        "name": "orderNumber",
        "amount": "totalAmount",
        "closeDate": "confirmationDate",
        "stage": "status",
        "currency": "currencyCode",
        "repExternalId": "salesRep.id",
        "notes": "comments"
      },
      "stageFilter": {
        "field": "status",
        "include": ["confirmed", "delivered"]
      },
      "modifiedAfterParam": "updatedSince"
    }
  }
}
```

---

### Example 2: ERP with Cursor Pagination

```json
{
  "baseUrl": "https://erp.company.com",
  "auth": {
    "type": "apiKey",
    "headerName": "X-API-Key",
    "apiKey": "..."
  },
  "pagination": {
    "type": "cursor",
    "cursorParam": "nextToken",
    "cursorPath": "pagination.nextCursor",
    "limitParam": "pageSize",
    "limitValue": 50
  },
  "responsePath": "results",
  "entities": {
    "reps": {
      "enabled": true,
      "endpoint": "/api/v2/employees",
      "fields": {
        "externalId": "employeeId",
        "name": "displayName",
        "email": "workEmail",
        "role": "position"
      },
      "filters": [
        { "key": "department", "value": "Sales" }
      ]
    },
    "deals": {
      "enabled": true,
      "endpoint": "/api/v2/sales-orders",
      "fields": {
        "externalId": "orderId",
        "name": "orderRef",
        "amount": "grandTotal",
        "closeDate": "orderDate",
        "stage": "workflowState",
        "currency": "currency",
        "repExternalId": "assignedTo.employeeId",
        "paymentStatus": "paymentState"
      },
      "stageFilter": {
        "field": "workflowState",
        "include": ["confirmed", "shipped", "invoiced"]
      },
      "paymentStatusMapping": {
        "paid": ["fullyPaid", "overpaid"],
        "unpaid": ["outstanding", "overdue"],
        "partial": ["partiallyPaid"],
        "on_hold": ["disputed", "writeOff"]
      },
      "modifiedAfterParam": "modifiedSince"
    }
  }
}
```

---

## How It Works

### Data Flow

```
User configures entity mappings
        │
        ▼
┌──────────────────────────────────┐
│ CustomConnector.fetchReps()      │
│  1. Read config.entities.reps    │
│  2. Build URL: baseUrl + endpoint│
│  3. Add filters as query params  │
│  4. Add pagination params        │
│  5. Add modifiedAfter if set     │
│  6. Fetch page, extract data     │
│     via responsePath JSONPath    │
│  7. Map each record: field       │
│     config → NormalizedRep       │
│  8. Paginate until exhausted     │
│  9. Return NormalizedRep[]       │
└──────────────────────────────────┘
```

### JSONPath Extraction

Uses a simple JSONPath implementation for nested field access:

```
"salesRep.id"     → record.salesRep.id (dot-notation)
"items[0].amount" → record.items[0].amount (array index)
"meta.status"     → record.meta.status
```

### Type Coercion

| CKit Field Type | Coercion from JSON |
|---|---|
| `string` | `String(value)` |
| `number` | `parseFloat(value)` — `null`/`NaN` → `0` |
| `Date` | `new Date(value)` — ISO 8601 or Unix timestamp |
| `PaymentStatus` | Lookup from `paymentStatusMapping` config |

### Compute Fields

Fields starting with `$` are computed, not mapped directly:

| Compute Field | Description |
|---|---|
| `$div:N:path` | Extracts `path` value and divides by N. Essential for APIs that store amounts in fractional units (e.g. micros, cents). Syntax: `"$div:1000000:amount.amountMicros"` converts `999000000` → `999`. |

---

## Edge Cases & Limitations

1. **Nested pagination**: Doesn't support APIs that require following links (HATEOAS). Requires a flat pagination model.
2. **Batch endpoints**: Not supported. Expects list endpoints.
3. **SOAP/XML**: Not supported. JSON-only.
4. **Custom authentication flows**: Only the four predefined auth types are supported.

---

## Testing the Custom Connector

The "Test Connection" button performs a HEAD request to the `baseUrl` with the configured auth headers. Success means the URL is reachable and the auth is accepted.

Sync behavior is verified via the sync history table on the integrations page, showing records created, updated, skipped, and failed per sync run.

---

## Files

```
plugins/custom/src/
├── connector.ts         # Main connector class (CustomConnector extends BasePlugin)
├── config-parser.ts     # Zod schemas for config validation (CustomConnectorConfigSchema)
├── jsonpath.ts          # JSONPath extractor (dot notation + array index)
├── pagination.ts        # Pagination strategies (offset, cursor, page)
└── auth.ts              # Auth handlers (apiKey, bearer, basic, oauth2)
```
