# HubSpot CRM Connector

## Overview

The HubSpot connector integrates CommissionKit with HubSpot CRM. It syncs **owners as reps** and **deals** (by pipeline stage). HubSpot is a CRM — it does not track payments, so closed-won deals are marked as `paid` by default.

Authentication is token-based: a single access token from a Service Key or Legacy App. No OAuth redirect flow.

---

## Connection

### Prerequisites

1. A HubSpot account with a Service Key or Legacy App
2. The app must have these scopes:
   - `crm.objects.owners.read` — fetch owners as reps
   - `crm.objects.deals.read` — fetch deals via search API
   - `crm.schemas.deals.read` — discover pipeline stages for stage mapping
3. Copy the token — paste it into CommissionKit and click Connect

### Configuration

```json
{
  "accessToken": "pat-na1-xxxx...",
  "syncClosedOnly": true
}
```

That's it. One field. No client ID, no secret, no OAuth flow.

---

## Data Fetching

### Reps (HubSpot Owners → CKit Rep)

Fetches all non-archived owners via `GET /crm/v3/owners` with cursor pagination. Maps them to CKit reps with `role: "Sales Rep"`.

### Deals (HubSpot Deals → CKit Deals)

Fetches deals via `POST /crm/v3/objects/deals/search`. By default only closed-won deals are synced (stages with `metadata.isClosed === "true"`). Deals with no owner (`hubspot_owner_id` empty) are filtered out.

**Pipeline discovery**: On each sync, the connector fetches all deal pipelines via `GET /crm/v3/pipelines/deals` and auto-discovers which stages are marked as closed-won. Users can override this via the **Stage Mapping** dialog on the integrations page.

### Stage Mapping

Users can customize how HubSpot stages map to CKit stages via the Stage Mapping dialog. Mappings are saved to `IntegrationConnection.metadata.stageMapping` and used for both filtering (which deals to sync) and normalization (which CKit stage to assign).

| HubSpot stage | Default CKit stage |
|---|---|
| `appointmentscheduled` | `pending` |
| `qualifiedtobuy` | `pending` |
| `presentationscheduled` | `pending` |
| `decisionmakerboughtin` | `pending` |
| `contractsent` | `pending` |
| `closedwon` | `closed_won` |
| `closedlost` | `closed_lost` |

---

## Files

```
plugins/hubspot/src/
├── connector.ts    # HubSpotConnector extends BasePlugin
├── client.ts       # HubSpot REST API v3 wrapper
└── index.ts        # Re-exports
```

## Sync Behavior

- **Auto-sync schedule**: every 10 min, hourly, daily, or manual
- **Hash-based change detection**: only upserts records that changed
- **Sync order matters**: sync Reps first, then Deals (deals reference reps by externalId)
- **Deals without owner**: filtered out (must assign an owner in HubSpot)

## What's NOT implemented (future)

- Webhooks (real-time deal updates)
- Write-back (commission data → HubSpot custom properties)
- OAuth 2.0 redirect flow
- Rate limiting
- Custom property definitions
