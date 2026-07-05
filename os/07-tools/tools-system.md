# Tools & Automation System

## Tool Inventory

### Development
| Tool | Purpose | URL | Agent |
|------|---------|-----|-------|
| GitHub | Code hosting | github.com | Forge |
| Coolify | Deployment | labs.kyrazo.com | Vault |
| MongoDB Atlas | Database | — | Vault |
| Redis Cloud | Cache/Queue | — | Vault |
| Stripe | Payments | stripe.com | Vault |
| Sentry | Error tracking | — | Vault |

### Sales & Marketing
| Tool | Purpose | URL | Agent |
|------|---------|-----|-------|
| Twenty CRM | Lead tracking | crm.commissionk.it | Scout |
| Apollo.io | Outreach | — | Clutch |
| Calendly | Scheduling | — | Clutch |
| Plausible | Web analytics | — | Lens |
| Eraser | Diagrams | app.eraser.io | Craft |
| Mintlify | Docs hosting | — | Ink |

### Communication
| Tool | Purpose | Agent |
|------|---------|-------|
| Email | Support, outreach | All |
| Telegram/Slack | Alerts, reports | Nexus |

## Automation Workflows

### Lead Capture → CRM

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#F0FDFA', 'primaryTextColor': '#111827', 'primaryBorderColor': '#0D9488', 'lineColor': '#0D9488', 'secondaryColor': '#F3F4F6', 'tertiaryColor': '#FFFFFF' }}}%%
flowchart TD
    A["Website form / calculator"] --> B[Webhook to API]
    B --> C["Scout enriches<br/>LinkedIn research"]
    C --> D[Create lead in Twenty CRM]
    D --> E[Clutch sends personalized outreach]
    E --> F[Log interaction in CRM]
```

### Content Pipeline

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#F0FDFA', 'primaryTextColor': '#111827', 'primaryBorderColor': '#0D9488', 'lineColor': '#0D9488', 'secondaryColor': '#F3F4F6', 'tertiaryColor': '#FFFFFF' }}}%%
flowchart TD
    A[Ink writes blog post] --> B["SEO optimization<br/>/content-seo skill"]
    B --> C[Publish to blog]
    C --> D[Signal posts to X/LinkedIn/Reddit]
    D --> E[Lens tracks performance]
    E --> F[Weekly content report]
```

### Commission Calculation

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#F0FDFA', 'primaryTextColor': '#111827', 'primaryBorderColor': '#0D9488', 'lineColor': '#0D9488', 'secondaryColor': '#F3F4F6', 'tertiaryColor': '#FFFFFF' }}}%%
flowchart TD
    A[Admin creates run] --> B["Queue job<br/>BullMQ"]
    B --> C[Calc worker processes deals]
    C --> D[Store results in MongoDB]
    D --> E["Notify admin<br/>email queue"]
    D --> F["Update rep portal<br/>real-time"]
```

### Deployment

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#F0FDFA', 'primaryTextColor': '#111827', 'primaryBorderColor': '#0D9488', 'lineColor': '#0D9488', 'secondaryColor': '#F3F4F6', 'tertiaryColor': '#FFFFFF' }}}%%
flowchart TD
    A[Code merged to main] --> B[CI runs tests + typecheck]
    B --> C["Vault runs<br/>/deploy-verify skill"]
    C --> D[Deploy to staging]
    D --> E[Health checks pass]
    E --> F[Deploy to production]
    F --> G[Post-flight verification]
    G --> H[Nexus reports deploy status]
```

### Daily Dashboard

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#F0FDFA', 'primaryTextColor': '#111827', 'primaryBorderColor': '#0D9488', 'lineColor': '#0D9488', 'secondaryColor': '#F3F4F6', 'tertiaryColor': '#FFFFFF' }}}%%
flowchart TD
    A["Cron job<br/>8:30 AM KSA"] --> B["Query Stripe<br/>revenue"]
    A --> C["Query Plausible<br/>traffic"]
    A --> D["Query CRM<br/>pipeline"]
    A --> E["Query DB<br/>product health"]
    B --> F[Lens generates Monday Dashboard]
    C --> F
    D --> F
    E --> F
    F --> G[Send to Telegram/Slack]
```

## Scripts

| Script | Purpose | Run Frequency | Owner |
|--------|---------|--------------|-------|
| `ck-monday-dashboard.py` | Generate daily briefing | Daily 8:30 AM | Lens |
| `ck-content-review.py` | Analyze content performance | Weekly Monday | Lens |
| `ck-blog-insert.py` | Publish blog to database | On publish | Ink |
| `ck-lead-scoring.py` | Score new leads | Real-time | Scout |
| `ck-outreach-sequence.py` | Send follow-up emails | Daily | Clutch |

## Tool Access Matrix

| Agent | GitHub | Coolify | Stripe | CRM | Eraser | Plausible |
|-------|--------|---------|--------|-----|--------|-----------|
| Nexus | Read | Read | Read | Read | Read | Read |
| Forge | Write | Write | — | — | — | — |
| Vault | Read | Admin | Admin | — | — | — |
| Scout | — | — | — | Write | — | — |
| Clutch | — | — | — | Write | — | — |
| Ink | — | — | — | — | Write | Read |
| Signal | — | — | — | — | — | Read |
| Lens | — | — | Read | Read | — | Admin |
| Craft | — | — | — | — | Write | — |

---
## Where to Go Next

- Back to entry point: `AGENTS.md`
- Next in this department: `os/08-governance/governance-system.md`
- Related technical context: `context/build-plan.md`
