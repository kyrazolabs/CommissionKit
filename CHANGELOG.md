# Changelog

## 2026-05-22 — API Payload Efficiency

### Added
- **Compression middleware** — gzip compression for all API responses (50-80% size reduction)
- **Response-size logging** — every response logs size + elapsed time for monitoring
- **Offset-based pagination** — `?limit=` (default 100, max 100) and `?offset=` params on list endpoints:
  - `GET /deals`, `GET /reps`, `GET /payouts`, `GET /disputes`, `GET /runs`, `GET /plans`
  - Responses remain bare arrays (backward-compatible). Pagination metadata in headers: `X-Total-Count`, `X-Limit`, `X-Offset`
- **Sparse fieldsets** — `?fields=id,name` param to request only needed fields on all paginated endpoints
- **`GET /runs/:id/results`** — new paginated endpoint for commission results
- **Cache-Control headers** — `no-store` by default, `public, max-age=3600` on `/billing/rates`, `private, max-age=60` on workspace settings

### Changed
- `GET /runs/:id` now returns run metadata only (no results). Use `?includeResults=true` for old behavior
- All Mongoose queries now use `.select()` projections to fetch only needed fields
- `GET /plans` — fixed N+1 query by batch-loading tiers in a single query
- ETag support enabled (Express 5 default) — clients can send `If-None-Match` for 304 responses

### Non-breaking guarantees
- All paginated endpoints default `limit=100` (matches previous all-results behavior)
- `?fields=` is optional — omitting it returns the full schema
- Compression is transparent to clients
- `GET /runs/:id?includeResults=true` preserves old behavior
