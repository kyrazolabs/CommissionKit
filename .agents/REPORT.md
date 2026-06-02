Here is the complete research document with all fees calculated for every provider and currency scenario.

---

# CommissionKit: Multi-Provider Payout Architecture & Fee Research 2026

## Architecture Overview

```
  ADMIN / COMPANY                    PLATFORM                        REP
  ┌─────────────┐    Stripe Top-Up    ┌─────────────┐    Payout API    ┌──────┐
  │  Bank/Card  │ ──────────────────→ │   Wallet    │ ──────────────→ │ Bank │
  └─────────────┘    (Money IN)        └─────────────┘    (Money OUT)   │ Card │
                                                                       └──────┘
  PAYOUT PROVIDERS: Wise (EUR-only acct) | Payoneer | PayPal | Stripe Connect
```

---

## 1. Money IN — Stripe Wallet Funding (Admin → Platform)

| Method | Fee | Speed | Best Use Case |
|---|---|---|---|
| **ACH / Bank Transfer (US)** | **FREE** | 1–3 days | Large deposits |
| **SEPA (EU)** | **FREE** | 1–2 days | EU workspaces |
| **FPS (UK)** | **FREE** | Same day | UK workspaces |
| **Wire Transfer (US)** | $2.00 per wire | Same day | Urgent large amounts |
| **Debit/Credit Card** | **2.9% + $0.30** | Instant | Small/urgent deposits |

> **Critical:** Always route admins to ACH/bank transfers. On a $10,000 deposit, a card costs you **$290.30** while ACH costs **$0**.

---

## 2. Money OUT — Payout Provider Fees (Per $1,000 Payout)

Assumptions: 50 active reps; monthly account fees amortized across all payouts; sender currency is **USD**.

### Scenario A: USD → USD (Same Currency)

| Provider | Fixed Fee | % Fee | FX Fee | Monthly Cost* | **Total Cost** |
|---|---|---|---|---|---|
| **Payoneer** | $1.50 | 0% | 0% | $0 | **$1.50** ⭐ |
| Wise (EUR-only) | $4.50 | 0.35% | 0%** | $0 | $8.00 |
| PayPal | $0 | 2.0% | 0% | $0 | $20.00 |
| Stripe Connect | $0.25 | 0.25% | 0% | $100.00 | $102.75 |

*\*Stripe Connect charges $2.00/month per active rep = $100/month amortized*  
*\*\*Assumes USD already converted and held in Wise (see Section 4 for true funding cost)*

**Winner:** Payoneer ($1.50 flat fee for first $50K/month volume).

---

### Scenario B: USD → EUR (Cross-Currency)

| Provider | Fixed Fee | % Fee | FX Fee | Monthly Cost | **Total Cost** |
|---|---|---|---|---|---|
| **Wise (EUR-only)** | $4.50 | 0.35% | 0.43% | $0 | **$12.30** ⭐ |
| Payoneer | $0 | 1.0% | 0.50% | $0 | $15.00 |
| Stripe Connect | $0.25 | 0.25% | 0.50% | $100.00 | $107.75 |
| PayPal | $0 | 2.0% | 3.50% | $0 | $55.00 |

**Winner:** Wise ($12.30) — lowest combined cost despite EUR-only constraint.

---

### Scenario C: USD → GBP (Cross-Currency)

| Provider | Fixed Fee | % Fee | FX Fee | Monthly Cost | **Total Cost** |
|---|---|---|---|---|---|
| **Wise (EUR-only)** | $4.50 | 0.35% | 0.43% | $0 | **$12.30** ⭐ |
| Payoneer | $0 | 1.5% | 0.50% | $0 | $20.00 |
| Stripe Connect | $0.25 | 0.25% | 0.50% | $100.00 | $107.75 |
| PayPal | $0 | 2.0% | 3.50% | $0 | $55.00 |

**Winner:** Wise ($12.30).

---

### Scenario D: USD → SAR (Exotic Currency — Saudi Arabia)

| Provider | Fixed Fee | % Fee | FX Fee | Monthly Cost | **Total Cost** |
|---|---|---|---|---|---|
| **Wise (EUR-only)** | $6.00 | 0.60% | 0.60% | $0 | **$18.00** ⭐ |
| Payoneer | $0 | 2.5% | 2.00% | $0 | $45.00 |
| Stripe Connect | $0.25 | 0.25% | 1.00% | $100.00 | $112.75 |
| PayPal | $0 | 2.0% | 4.00% | $0 | $60.00 |

**Winner:** Wise ($18.00) — significantly cheaper than Payoneer/PayPal for exotic currencies.

---

## 3. Wise EUR-Only Account — Hidden Funding Cost

Because you only hold **EUR local account details** in Wise, receiving USD from your Stripe balance requires an extra conversion step. Here is the true cost to get USD into Wise:

| Step | Fee | Notes |
|---|---|---|
| **1. Receive USD via SWIFT** | **$6.11 per wire** | No local USD account details in Wise |
| **2. USD → EUR Conversion** | **~0.43%** of amount | Wise mid-market rate + conversion fee |
| **3. Hold EUR in Wise** | FREE | No holding fee |
| **4. Send EUR → Rep** | 0.33% – 0.60% + fixed | Depends on destination currency |

### Reality Check

If your Stripe balance is in USD and you want to payout via Wise, you pay an **extra $6.11 + 0.43%** just to get money INTO Wise. On a $10,000 batch, that is **$49.41 wasted** before the rep even gets paid.

**Better paths:**

- **Option A:** Open **USD local account details** in Wise (free for Business accounts). Then fund Wise via ACH from your US bank for $0.
- **Option B:** Skip Wise for USD payouts entirely. Use Payoneer or Stripe Connect for USD→USD, and reserve Wise only for EUR/GBP payouts.

---

## 4. Monthly Volume Example ($100,000 across 50 reps, $2,000 each)

**Scenario:** Cross-currency payout **USD → EUR**

| Provider | Top-Up Cost | Account Fees | Payout Fees | FX Fees | **Total Monthly** | % of Volume |
|---|---|---|---|---|---|---|
| **Stripe Connect** | $0.00 | $100.00 | $250.25 | $500.00 | **$850.25** | **0.85%** ⭐ |
| Wise (EUR-only)* | $0.00 | $0.00 | $575.00 | $430.00 | $1,005.00 | 1.00% |
| Payoneer | $1,000.00 | $0.00 | $1,075.00 | $500.00 | $2,575.00 | 2.57% |
| PayPal | $0.00 | $0.00 | $2,000.00 | $3,500.00 | $5,500.00 | 5.50% |

*\*Wise top-up assumes SEPA/EUR source. If funding from USD via SWIFT, add**$611** (50 wires × $6.11) + **$430** conversion = **$1,041 EXTRA**. True Wise cost would then be **$2,046.00 (2.05%)**.*

**Winner at scale:** Stripe Connect (0.85% of volume once active).

---

## 5. Lowest vs Highest Possible Fees

| Provider | **Lowest (Best Case)** | **Highest (Worst Case)** |
|---|---|---|
| **Stripe Connect** | $0.25 + 0.25% = **$2.75** per $1K (same currency, no FX) | $2/mo + 0.25% + 0.25% cross-border + 1% FX = **~$17.50** per $1K |
| **Wise (EUR-only)** | 0.33% + $4.50 = **$7.80** per $1K (EUR→EUR local) | $6.11 SWIFT + 0.43% + 0.60% + $6 fixed = **~$24.50** per $1K |
| **Payoneer** | $1.50 flat = **$1.50** per $1K (USD→USD, under $50K/mo) | 4% + 3% FX + 1% receive fee = **~$80.00** per $1K |
| **PayPal** | 2% = **$20.00** per $1K (USD→USD wallet) | 2% + 4% FX = **$60.00** per $1K (exotic currency) |

---

## 6. Strategic Recommendations

### Phase 1: Immediate (While Waiting for Stripe Connect)

- **Primary:** **Payoneer** for USD→USD payouts ($1.50 flat is unbeatable under $50K/mo).
- **Secondary:** **Wise** for EUR/GBP payouts (lowest FX cost at ~1.2% all-in).
- **Fallback:** **PayPal** for reps who refuse to add bank details (brand recognition, instant to wallet).

### Phase 2: Once Stripe Connect Is Enabled

- Switch **Stripe Connect** to primary for all corridors.
- Cost: **0.85% of volume** (cheapest at scale).
- Benefit: Unified ledger, no external provider fragmentation, webhooks for status tracking.
- Keep **PayPal** as a "rep preference" option for those without bank accounts.

### Phase 3: Fix Your Wise Setup

- Open **USD local account details** inside Wise Business (free).
- This eliminates the $6.11 SWIFT wire fee and 0.43% forced conversion.
- Then fund Wise via ACH from your US bank for $0, or route Stripe payouts directly if multi-currency.

### Tier Gating

| Plan | Payout Access |
|---|---|
| **Starter** | Manual tracking only (mark paid externally) |
| **Professional** | Payoneer + Wise batch payouts; 1 approver |
| **Business** | Stripe Connect + all providers; instant; multi-approver; unlimited |

### Never Use Card Top-Ups for Funding

- 2.9% + $0.30 destroys your margin.
- On $100K volume, that is **$2,900+** in fees vs **$0** with ACH.
- Only allow card top-ups for emergency deposits under $1,000.
