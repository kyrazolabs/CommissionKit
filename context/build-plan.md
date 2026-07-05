# Build Plan — CommissionKit

This plan describes how to set up, develop, test, and deploy the project. It is derived from `AGENTS.md`, `README.md`, and the actual repository structure.

## 1. Prerequisites

- **Bun** installed (`bun --version`).
- **Node.js 24** for some background dev scripts.
- **MongoDB** running (default: `mongodb://localhost:27017/commissionkit`).
- **Redis** running (default: `redis://localhost:6379`).

### Quick Infrastructure

```bash
docker compose -f infra/database.docker-compose.yml up -d
```

This starts MongoDB 7.0 and Redis 7 alpine.

## 2. Environment Setup

Copy example env files:

```bash
cp artifacts/api/.env.example artifacts/api/.env
cp artifacts/web/.env.example artifacts/web/.env
```

### Required API Env (`artifacts/api/.env`)

| Variable | Purpose |
|----------|---------|
| `MONGO_URL` | MongoDB connection string |
| `REDIS_URL` | Redis connection string |
| `SESSION_SECRET` | Session encryption |
| `BETTER_AUTH_SECRET` | Better Auth signing secret |
| `STRIPE_SECRET_KEY` | Stripe API key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `STRIPE_STARTER_PRICE_ID` | Stripe price IDs (monthly + annual variants) |
| `STRIPE_GROWTH_PRICE_ID` | ... |
| `STRIPE_PRO_PRICE_ID` | ... |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | Email delivery |
| `S3_*` | Log upload storage |
| `SENTRY_*` | Error monitoring (optional) |
| `APP_URL` | Public app URL |
| `BETTER_AUTH_URL` | Auth base URL |
| `ALLOWED_ORIGINS` | CORS origins |

### Required Web Env (`artifacts/web/.env`)

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | API base URL (`http://localhost:8088`) |
| `VITE_BETTER_AUTH_URL` | Auth base URL |
| `VITE_STRIPE_*_PRICE_ID` | Stripe price IDs for checkout |

## 3. Install Dependencies

```bash
bun install
```

## 4. Development

Start services in separate terminals (or use a process runner):

```bash
# API server + workers
bun run --filter @workspace/api dev

# Web SPA
bun run --filter @workspace/web dev

# Blog
bun run --filter @workspace/blog dev

# BullMQ Board
bun run --filter @workspace/bullmq dev
```

### Dev Ports

| Service | Port |
|---------|------|
| Web (Vite) | 3000 |
| API (Express) | 8088 |
| Blog (Next.js) | 3001 |
| BullMQ Board | 3030 |

### Nginx Reverse Proxy (Remote Dev)

```bash
sudo cp dev.nginx.conf /etc/nginx/sites-available/ckdev
sudo ln -sf /etc/nginx/sites-available/ckdev /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Access at `https://ckdev.commissionk.it` (or `https://<server-ip>`). The checked-in config uses self-signed certificate paths (`/etc/nginx/ssl/ckdev/`) for the dev preview; replace them with trusted certificates (e.g. Let's Encrypt) for trusted access.

## 5. Code Generation

If you modify `lib/api-spec/openapi.yaml`, regenerate clients and schemas:

```bash
bun run --filter @workspace/api-spec codegen
```

This updates:
- `lib/api-client-react/src/generated/api.ts`
- `lib/api-client-react/src/generated/api.schemas.ts`
- `lib/api-zod/src/generated/api.ts`

## 6. Testing

```bash
# All tests
bun test

# Specific workspace
bun test --filter @workspace/db
bun test --filter @workspace/api
bun test --filter @workspace/web
bun test --filter @workspace/queue

# Single file
bun test artifacts/api/src/routes/reps.test.ts

# Watch mode
bun test --watch

# Coverage
bun test --coverage
```

### Test Setup

- API tests use `mongodb-memory-server` via `artifacts/api/test/setup-db.ts` and `artifacts/api/test/preload-db.ts`.
- Web tests use `happy-dom` via `test/dom-setup.ts`.
- Redis tests use `ioredis-mock` (`REDIS_URL=redis-mock://`).

## 7. Type Checking

```bash
# Two-phase: libs then apps/scripts
bun run typecheck

# Libs only
bun run typecheck:libs
```

## 8. Building

```bash
# Full build (typecheck + all workspace builds)
bun run build

# API only
bun run --filter @workspace/api build

# Web only
bun run --filter @workspace/web build
```

### Web Build Details

The web build script:
1. Generates sitemap.
2. Builds client bundle to `dist/public`.
3. Builds SSR bundle to `dist/server`.
4. Prerenders SEO pages.
5. Removes `dist/server`.

## 9. Deployment

### Coolify (Primary)

- `docker-compose.yml` defines `api`, `web`, and `blog` services.
- `infra/database.docker-compose.yml` defines MongoDB + Redis.
- API Dockerfile: `Dockerfile.api` (Bun single-stage).
- Web Dockerfile: `Dockerfile.web` (Bun build + Nginx).
- Blog Dockerfile: `Dockerfile.blog`.

### Manual Docker

```bash
docker compose up -d
```

### Health Checks

- API: `GET /api/healthz`
- Web: `GET /healthz`
- Blog: `GET /api/healthz`

## 10. Adding a New Enterprise Engine

1. Create engine file: `artifacts/api/src/workers/engines/<customer>.engine.ts`.
2. Implement `CalcEngine` interface.
3. Register in `artifacts/api/src/workers/engines/registry.ts`.
4. Add models under `lib/db/src/schema/<customer>/` if needed.
5. Add routes under `artifacts/api/src/routes/enterprise/<customer>/` if needed.
6. Add frontend pages under `artifacts/web/src/pages/enterprise/<customer>/` if needed.
7. Set `workspace.commissionEngine = "<customer>"`.

See `docs/enterprise-engine-architecture.md` for full specification.

## 11. Adding a New Integration Plugin

1. Create workspace: `plugins/<name>/`.
2. Implement `CKitPlugin` from `@workspace/plugins-core`.
3. Register in `artifacts/api/src/index.ts`.
4. Add connector card + form in `artifacts/web/src/pages/integrations/`.

## 12. Common Issues

| Issue | Fix |
|-------|-----|
| Port already in use | Set `PORT` env or kill existing process. |
| MongoDB connection fail | Start database stack; check `MONGO_URL`. |
| Redis connection fail | Start Redis; check `REDIS_URL`. |
| Type errors after spec change | Run `bun run --filter @workspace/api-spec codegen`. |
| Tests hang | Ensure no real Redis/Mongo expected; use mocks. |
| Stripe webhooks fail locally | Use Stripe CLI or set webhook secret from dashboard. |

## 13. Release Checklist

- [ ] All tests pass (`bun test`).
- [ ] Typecheck passes (`bun run typecheck`).
- [ ] Build passes (`bun run build`).
- [ ] Env variables updated in deployment target.
- [ ] Database migrations/backward-compatible changes applied.
- [ ] OpenAPI spec regenerated if changed.
- [ ] Sentry sourcemaps uploaded (production build).

---
## Where to Go Next

- Back to entry point: `AGENTS.md`
- Next in technical series: `context/progress-tracker.md`
- Related business context: `os/07-tools/tools-system.md`
