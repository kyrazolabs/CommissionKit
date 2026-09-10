# Product Catalog

Workspace-scoped catalog of items a customer sells. One model with a `kind` enum, kind-specific `attributes`, optional S3 image (resized with `Bun.Image`), and deal line items.

## In scope

- CRUD at `/api/products` (OOP: routes → controller → singleton `ProductService`)
- `kind`: `service` | `property` | `vehicle` | `job` | `insurance` | `physical_good` | `subscription` | `other`
- Shared fields: name, kind, description, sku, unitPrice, currency, status
- Kind-specific `attributes` on the same document
- Images: `POST /api/products/:id/image` (jpeg/png/webp/gif, max 2MB) → `Bun.Image` resize 800×800 inside → WebP on S3. `GET /api/products/:id/image` proxies the object
- Deal `lineItems[]` with snapshots; deal `amount` is the line sum when lines exist
- MCP: `list_products`, `get_product`, `create_product`, `update_product`
- API key permission `write:products`
- Sample-data products + deal line items
- UI: `/dash/products` card grid (image or logo-symbol fallback), deal line-item editor

## Out of scope

- Separate Product collections per industry
- Deal CSV line-item columns
- Subscription caps on product count
