# Engineering System

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Bun 1.3+ |
| Backend | Express 5 |
| Frontend | React 19 + Vite 7 |
| Database | MongoDB 7.0 + Mongoose |
| Cache/Queue | Redis 7 + BullMQ |
| Auth | Better Auth |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Router | Wouter |
| Charts | Recharts |
| Icons | Lucide React |
| Deploy | Coolify + Docker |

## Development Workflow

### 1. Planning
- Compass defines what to build (product brief)
- Forge reviews technical feasibility
- Plan agent produces implementation plan (/architect skill)

### 2. Development
- Forge or Pixel implements
- Follow AGENTS.md immutable rules
- No hardcoded hex values, no console.log, Bun only

### 3. Review
- Self-review against context/ standards
- Review agent three-layer check (/review skill)
- Forge approves before merge

### 4. Testing
- `bun test` must pass
- `bun run typecheck` must pass
- Mock all external services
- New features need tests

### 5. Deployment
- Vault runs deploy-verify skill
- Pre-flight: tests, typecheck, build
- Deploy: staging → verify → production
- Post-flight: health checks, error monitoring

### 6. Documentation
- Update context/ files if conventions change
- Update ui-registry.md for new UI patterns
- Update API docs if endpoints change

## Code Standards

### Immutable Rules
- Bun only (no npm/yarn/pnpm)
- CSS variables for colors (no hardcoded hex)
- Mongoose for DB (not raw MongoDB)
- Wouter for routing (not React Router)
- Pino logger (no console.log in production)
- Test everything (bun test)
- Mock external services in tests

### File Organization
```
artifacts/
├── api/              # Express backend
│   ├── src/
│   │   ├── routes/   # API routes
│   │   ├── middleware/
│   │   ├── workers/  # BullMQ workers
│   │   └── lib/      # Utilities
│   └── test/         # Test helpers
├── web/              # React frontend
│   ├── src/
│   │   ├── pages/    # Route pages
│   │   ├── components/ui/
│   │   └── hooks/
│   └── test/         # DOM setup
└── blog/             # Next.js marketing blog
```

## Infrastructure

### Services
| Service | Port | Purpose |
|---------|------|---------|
| API | 8088 | Express + workers |
| Web | 3000 | Vite SPA |
| Blog | 3001 | Next.js |
| Bull Board | 3030 | Queue monitoring |

### Databases
| Database | Version | Purpose |
|----------|---------|---------|
| MongoDB | 7.0 | Primary data |
| Redis | 7 | Cache, queues, sessions |

### Deployment
- Coolify-managed Docker containers
- Environment variables per service
- Health checks on all services
- Automatic SSL via Let's Encrypt

## Incident Response

| Severity | Response Time | Action |
|----------|--------------|--------|
| P0 — Revenue down | 15 min | All hands, rollback if needed |
| P1 — Feature broken | 1 hour | Fix or rollback |
| P2 — Degraded | 4 hours | Schedule fix |
| P3 — Cosmetic | 24 hours | Queue for next sprint |

### Runbook
1. Detect (monitoring alert)
2. Communicate (notify team channel)
3. Assess (scope and severity)
4. Fix or rollback
5. Verify (health checks pass)
6. Post-mortem (within 24h for P0/P1)

---
## Where to Go Next

- Back to entry point: `AGENTS.md`
- Next in this department: `os/03-product/product-system.md`
- Related technical context: `context/architecture.md`
