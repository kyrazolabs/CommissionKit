# CommissionKit Operating System

## Company Identity

**Name:** CommissionKit  
**Mission:** Eliminate shadow accounting and commission disputes for sales teams.  
**Vision:** Every sales team has transparent, accurate, and fast commission management.  
**Values:**
1. Accuracy over speed
2. Transparency builds trust
3. Reps deserve clarity
4. Automation replaces spreadsheets

## What We Build

CommissionKit is a B2B SaaS platform for sales commission management.

**Core Modules:**
- Commission Engine (flat, tiered, accelerator, custom)
- Deal Tracking & Import
- Commission Plan Builder
- Commission Runs & Auditing
- Payout Management
- Rep Portal (JWT-based)
- Dispute Resolution
- CRM/ERP Integrations

**Target:** B2B companies with 5-100+ sales reps

## How This OS Works

This folder contains the entire operating system of CommissionKit as a company. Every team, process, tool, and decision lives here.

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#F0FDFA', 'primaryTextColor': '#111827', 'primaryBorderColor': '#0D9488', 'lineColor': '#0D9488', 'secondaryColor': '#F3F4F6', 'tertiaryColor': '#FFFFFF' }}}%%
graph TD
    C["00-company<br/>Identity, Values, Structure"] --> S["01-strategy<br/>Goals, OKRs, Planning"]
    S --> R["02-revenue<br/>Sales & Marketing"]
    R --> P["03-product<br/>Engineering & Design"]
    P --> O["04-operations<br/>Legal, Finance, Admin"]
    O --> PE["05-people<br/>Hiring, Onboarding, Culture"]
    PE --> CU["06-customer<br/>Support & Success"]
    CU --> T["07-tools<br/>Automation & Scripts"]
    T --> G["08-governance<br/>Compliance & Security"]
```

## Agent Teams

Our AI workforce maps to these folders:

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#F0FDFA', 'primaryTextColor': '#111827', 'primaryBorderColor': '#0D9488', 'lineColor': '#0D9488', 'secondaryColor': '#F3F4F6', 'tertiaryColor': '#FFFFFF' }}}%%
graph LR
    subgraph Command
        NEXUS["Nexus<br/>Chief of Staff"]
    end

    subgraph GTM
        SCOUT["Scout<br/>Lead Gen"]
        CLUTCH["Clutch<br/>Sales Closer"]
        BRIDGE["Bridge<br/>Partnerships"]
    end

    subgraph Marketing
        INK["Ink<br/>Content"]
        SIGNAL["Signal<br/>Social"]
        LENS["Lens<br/>Analytics"]
    end

    subgraph Engineering
        FORGE["Forge<br/>Tech Lead"]
        PIXEL["Pixel<br/>Frontend"]
        VAULT["Vault<br/>DevOps"]
    end

    subgraph Product
        COMPASS["Compass<br/>PM"]
        PULSE["Pulse<br/>User Research"]
        CRAFT["Craft<br/>UX Design"]
    end

    NEXUS --> SCOUT
    NEXUS --> CLUTCH
    NEXUS --> BRIDGE
    NEXUS --> INK
    NEXUS --> SIGNAL
    NEXUS --> LENS
    NEXUS --> FORGE
    NEXUS --> PIXEL
    NEXUS --> VAULT
    NEXUS --> COMPASS
    NEXUS --> PULSE
    NEXUS --> CRAFT
```

## Status

All 8 departments have foundational content. Each folder is actively maintained and grows as processes mature. See `os/STATUS.md` for detailed completion status and next priorities.

---
## Where to Go Next

- Back to entry point: `AGENTS.md`
- Next: `os/STATUS.md`
- Start a department: `os/00-company/identity/company-identity.md`
