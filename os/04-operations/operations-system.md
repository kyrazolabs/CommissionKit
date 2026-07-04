# Operations System

## Legal

### Contracts
- **Sales Rep Agreement:** Template in `04-operations/legal/`
- **Terms of Service:** Published at /terms
- **Privacy Policy:** Published at /privacy
- **Security Policy:** Published at /security
- **Data Processing Agreement:** For enterprise customers

### Entity
- Business structure: [To be defined]
- Jurisdiction: [To be defined]
- Registered address: [To be defined]

### Intellectual Property
- All code: Copyright CommissionKit
- Trademark: CommissionKit name and logo
- Open source: None currently

## Finance

### Accounting
- Tool: [To be selected — QuickBooks / Xero / Wave]
- Chart of accounts: [To be defined]
- Bookkeeping frequency: Monthly

### Revenue Tracking
- Source of truth: Stripe
- MRR tracking: Custom dashboard (Lens)
- Expense categories:
  - Infrastructure (Coolify, databases)
  - Tools (software subscriptions)
  - Marketing (content, ads)
  - Legal/professional
  - Taxes

### Cash Flow
- Current runway: [To be calculated]
- Burn rate: [To be calculated]
- Break-even target: $5,000 MRR

### Pricing & Billing
- Payment processor: Stripe
- Billing cycles: Monthly + Annual
- Invoice generation: Automated
- Tax collection: [To be configured based on jurisdictions]

### Budget

| Category | Monthly Budget | % of Revenue |
|----------|---------------|--------------|
| Infrastructure | $200 | ~13% |
| Marketing | $300 | ~20% |
| Tools | $100 | ~7% |
| Legal/Admin | $100 | ~7% |
| Reserve | $200 | ~13% |

**Total monthly burn:** ~$900 (pre-revenue)

## Admin

### Email Domains
- Primary: commissionk.it
- Support: support@commissionk.it
- Sales: sales@commissionk.it
- Founder's email: [To be configured]

### Tools & Subscriptions

| Tool | Purpose | Cost | Owner |
|------|---------|------|-------|
| Stripe | Payments | Transaction % | Vault |
| Coolify | Deployment | $20/mo | Vault |
| MongoDB Atlas | Database | $50/mo | Vault |
| Redis Cloud | Cache | $20/mo | Vault |
| GitHub | Code | $0 (public) | Forge |
| Plausible | Analytics | $9/mo | Lens |
| Eraser | Diagrams | Free tier | Craft |
| Twenty CRM | CRM | Free tier | Scout |
| Apollo.io | Outreach | [To be configured] | Clutch |
| Calendly | Scheduling | Free tier | Clutch |

### Password & Secrets Management
- Tool: 1Password / Bitwarden
- Master account: Founder
- Shared vault: Operations team (when human team grows)
- API keys: Environment variables only, never in code
- Rotation schedule: Quarterly

## Monthly Operations Checklist

- [ ] Review P&L (Lens)
- [ ] Pay invoices
- [ ] Review tool subscriptions (cancel unused)
- [ ] Update budget forecast
- [ ] File any required reports
- [ ] Backup verification (Vault)
- [ ] Security review (Vault)

---
## Where to Go Next

- Back to entry point: `AGENTS.md`
- Next in this department: `os/05-people/people-system.md`
- Related technical context: `os/07-tools/tools-system.md`
