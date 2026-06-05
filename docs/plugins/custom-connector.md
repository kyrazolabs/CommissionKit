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
        "deals": { "$ref": "#/definitions/entityMapping" },
        "projects": { "$ref": "#/definitions/entityMapping" },
        "invoices": { "$ref": "#/definitions/entityMapping" }
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
    },
    "webhook": {
      "type": "object",
      "title": "Webhook (Optional)",
      "properties": {
        "enabled": { "type": "boolean", "title": "Enable Webhooks" },
        "signatureHeader": {
          "type": "string",
          "title": "Signature Header",
          "description": "Header containing the HMAC signature, e.g. 'X-Webhook-Signature'"
        },
        "signatureAlgorithm": {
          "type": "string",
          "enum": ["hmac-sha256", "hmac-sha512", "plain"],
          "title": "Signature Algorithm"
        },
        "eventTypePath": {
          "type": "string",
          "title": "Event Type JSONPath",
          "description": "Where to find the event type in the webhook payload"
        },
        "entityIdPath": {
          "type": "string",
          "title": "Entity ID JSONPath",
          "description": "Where to find the entity ID"
        },
        "eventMapping": {
          "type": "object",
          "title": "Event Type Mapping",
          "additionalProperties": true,
          "description": "Maps raw event type strings to CKit events. e.g. { 'order.created': 'deal.created' }"
        }
      }
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
            "amount": { "type": "string", "title": "Amount" },
            "closeDate": { "type": "string", "title": "Close Date" },
            "stage": { "type": "string", "title": "Stage" },
            "currency": { "type": "string", "title": "Currency" },
            "repExternalId": { "type": "string", "title": "Rep External ID" },
            "projectExternalId": { "type": "string", "title": "Project External ID" },
            "invoiceNumber": { "type": "string", "title": "Invoice Number" },
            "paymentStatus": { "type": "string", "title": "Payment Status" },
            "dueDate": { "type": "string", "title": "Due Date" },
            "notes": { "type": "string", "title": "Notes" },
            "totalValue": { "type": "string", "title": "Total Value" },
            "totalCost": { "type": "string", "title": "Total Cost" }
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

### Example 2: ERP with Invoices

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
    },
    "invoices": {
      "enabled": true,
      "endpoint": "/api/v2/invoices",
      "fields": {
        "externalId": "invoiceId",
        "invoiceNumber": "invoiceRef",
        "amount": "total",
        "closeDate": "issueDate",
        "currency": "currency",
        "paymentStatus": "paymentState",
        "dueDate": "dueDate",
        "projectExternalId": "project.relatedId",
        "repExternalId": "salesRep.employeeId"
      },
      "modifiedAfterParam": "modifiedSince"
    }
  },
  "webhook": {
    "enabled": true,
    "signatureHeader": "X-Webhook-Signature",
    "signatureAlgorithm": "hmac-sha256",
    "eventTypePath": "eventType",
    "entityIdPath": "payload.id",
    "eventMapping": {
      "order.confirmed": "deal.created",
      "order.updated": "deal.updated",
      "order.cancelled": "deal.deleted",
      "employee.hired": "rep.created",
      "employee.updated": "rep.updated",
      "invoice.created": "invoice.created",
      "invoice.paid": "invoice.updated"
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
| `$period` | Derives "YYYY-MM" from another date field. Syntax: `"$period:closeDate"` |
| `$constant` | Sets a static value. Syntax: `"$constant:USD"` |
| `$concat` | Concatenates multiple fields. Syntax: `"$concat:firstName,lastName"` |
| `$fromEmail` | Extracts domain from email. Syntax: `"$fromEmail:email"` |

---

## Edge Cases & Limitations

1. **Nested pagination**: Doesn't support APIs that require following links (HATEOAS). Requires a flat pagination model.
2. **Batch endpoints**: Not supported. Expects list endpoints.
3. **GraphQL**: Not supported. REST-only.
4. **SOAP/XML**: Not supported. JSON-only.
5. **Custom authentication flows**: Only the four predefined auth types are supported.
6. **Very large datasets**: Max 500,000 records per sync (configurable). Beyond that, batch into multiple syncs by date range.
7. **Rate limiting**: The connector auto-throttles if it receives HTTP 429 responses.
8. **TLS**: HTTPS with valid certificates only. Self-signed certificates can be allowed via a config flag: `"allowInsecureTLS": true`.

---

## Testing the Custom Connector

The "Test Connection" button performs these checks:
1. Reachability: HEAD request to `baseUrl`
2. Authentication: GET request to any enabled entity endpoint with auth headers
3. Schema validation: Parse the response and verify field mappings resolve correctly
4. Sample data: Return the first record from each entity type as a preview

---

## Files

```
plugins/custom/
├── index.ts                  # Default export: CustomConnector
├── connector.ts              # Main connector class
├── config-parser.ts          # Parse and validate the JSON config
├── jsonpath.ts               # Simple JSONPath extractor
├── pagination.ts             # Pagination strategies (offset, cursor, page)
├── auth.ts                   # Auth handler (apiKey, bearer, basic, oauth2)
└── types.ts                  # Custom connector types + config Zod schema
```
