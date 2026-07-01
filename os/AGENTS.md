# AGENTS.md — CommissionKit OS

This file guides agents when working on business, sales, marketing, or operational tasks for CommissionKit.

## Scope

The `os/` folder contains the business operating system. It is separate from the technical codebase (`artifacts/`, `lib/`, `context/`) and the agent skill system (`.opencode/skills/`).

## How to navigate

| Topic | Start here |
|-------|------------|
| Who we sell to | `gtm/ideal-client-profile.md` |
| How we position and price | `gtm/positioning.md`, `gtm/pricing.md` |
| How we create content | `sops/01-content-creation-sop.md`, `content-system/` |
| How we run sales | `sales-system/sales-rep-playbook.md`, `sops/04-sales-calls-sop.md` |
| How we generate leads | `sops/03-lead-generation-sop.md`, `crm/AGENTS.md` |
| How we book demos | `sops/05-demo-booking-sop.md` |
| How we onboard clients | `sops/06-client-onboarding-sop.md` |
| How we track performance | `dashboard/`, `sops/08-performance-tracking-sop.md` |
| Commission structure templates | `sales-system/commission-calculator.md` |
| Legal templates | `contracts/` |

## Rules

1. **Use existing patterns.** Do not invent new naming, pricing, or processes unless the user explicitly asks.
2. **Reference the CRM playbook.** Any LinkedIn research or outreach must follow `crm/AGENTS.md`.
3. **Update SOPs.** If a process changes, update the relevant SOP in `sops/`.
4. **Keep secrets out.** Never write API keys, tokens, or credentials into any OS file.
5. **Prefer kebab-case.** All new files and folders must use lowercase words separated by hyphens.

## Cross-references

- Technical architecture: `context/architecture.md`
- Technical code standards: `context/code-standards.md`
- UI design system: `context/ui-tokens.md`, `context/ui-rules.md`
