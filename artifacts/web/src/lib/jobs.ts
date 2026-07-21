export interface Job {
  slug: string;
  title: string;
  department: string;
  location: string;
  type: "contract" | "full-time" | "part-time";
  schedule: "full-time" | "part-time";
  description: string;
  responsibilities: string[];
  requirements: string[];
  offers: string[];
  isActive: boolean;
  earningsExample?: string;
  leadPromise?: string;
  payoutTimeline?: string;
  clawbackPolicy?: string;
}

export const JOBS: Job[] = [
  {
    slug: "sales-representative",
    title: "Inside Sales Representative (SaaS / Commission-Based)",
    department: "Sales",
    location: "Remote",
    type: "contract",
    schedule: "full-time",
    description:
      "We're looking for independent sales contractors to sell CommissionKit to SMBs and enterprises tired of managing commissions in spreadsheets. We provide qualified leads. You close them — across Starter, Growth, and Pro tiers. You get the full product to sell. No cold calling unless you want to.",
    responsibilities: [
      "Close deals across all tiers — Starter ($49/mo), Growth ($99/mo), and Pro ($249/mo)",
      "Close qualified leads we provide and convert them into paying customers",
      "Run product demos and show finance and sales leaders how CommissionKit solves their commission problems",
      "Close deals and manage the sales cycle from first contact to signed contract",
      "Maintain accurate records in our CRM and report on pipeline weekly",
      "Provide feedback from prospects to help shape our product roadmap",
    ],
    requirements: [
      "3+ years of B2B sales experience, preferably in SaaS or fintech",
      "Self-motivated. You'll be working remotely and nobody will be looking over your shoulder — so you need to be the kind of person who gets things done without a manager chasing you.",
      "Excellent written and verbal communication skills",
      "Familiarity with CRM tools (HubSpot, Salesforce, or similar)",
      "Existing network of decision-makers in HR, Finance, or Sales Operations is a plus",
    ],
    offers: [
      "30% commission on the customer's first invoice — paid within 15 days",
      "10% lifetime recurring commission on every invoice after the first — as long as the customer stays, you get paid",
      "1.25x multiplier on deals you self-source from your own network",
      "Payout within 15 days after first invoice. No minimums. No delays.",
      "Flexible schedule. Work when you want.",
      "Fully remote. Work from wherever.",
      "We give you demo accounts, sales decks, and training. You're not figuring this out alone.",
      "Direct access to founding team for support and fast decisions",
    ],
    isActive: true,
    leadPromise:
      "We send you 10+ qualified leads every month. These are people who've already shown interest. Your job is to close them. If you have your own network you want to tap into too, even better — and you'll earn 1.25x on those deals.",
    payoutTimeline:
      "Get paid within 15 days after the customer's first invoice. No minimum payout thresholds. Your commission hits your account like clockwork.",
    earningsExample:
      "$3,000–$8,000/month for top performers. Here's how it stacks: close 5 Pro deals at $249/mo from our leads, that's $373 upfront. Do that every month and your recurring portfolio builds — after 6 months your residual alone is over $750/month and climbing. Add a few self-sourced deals at 1.25x and you're clearing $3K–$5K easily. Reps who hustle and blend our leads with their own network hit the high end of the range.",
    clawbackPolicy:
      "Clawback applies only to the recurring portion, not the upfront commission. 100% if customer cancels within 30 days, 75% within 90 days, 50% within 180 days. After 180 days, no clawback.",
  },
  {
    slug: "sales-representative-part-time",
    title: "Inside Sales Representative (SaaS / Commission-Based, Part-Time)",
    department: "Sales",
    location: "Remote",
    type: "contract",
    schedule: "part-time",
    description:
      "We're looking for part-time independent sales contractors to sell CommissionKit. If you want commission-only side income without giving up your day job, this is built for that. We provide qualified leads. You close them — across all tiers. No cold calling unless you want to.",
    responsibilities: [
      "Close deals across all tiers — Starter ($49/mo), Growth ($99/mo), and Pro ($249/mo)",
      "Close qualified leads we provide and convert them into paying customers",
      "Run product demos and articulate CommissionKit's value proposition to finance and sales leaders",
      "Close deals and manage the sales cycle from first contact to signed contract",
      "Maintain accurate records in our CRM and report on pipeline weekly",
      "Provide feedback from prospects to help shape our product roadmap",
    ],
    requirements: [
      "1+ years of B2B sales experience, preferably in SaaS or fintech",
      "Self-motivated. You'll be working remotely and nobody will be looking over your shoulder — so you need to be the kind of person who gets things done without a manager chasing you.",
      "Excellent written and verbal communication skills",
      "Familiarity with CRM tools (HubSpot, Salesforce, or similar)",
      "Existing network of decision-makers in HR, Finance, or Sales Operations is a plus",
    ],
    offers: [
      "30% commission on the customer's first invoice — paid within 15 days",
      "10% lifetime recurring commission on every invoice after the first — as long as the customer stays, you get paid",
      "1.25x multiplier on deals you self-source from your own network",
      "Payout within 15 days after first invoice. No minimums. No delays.",
      "Flexible hours — work when it fits your life, not the other way around",
      "Fully remote. Anywhere in the world.",
      "We give you demo accounts, sales decks, and training. You're not figuring this out alone.",
      "Direct access to founding team for support and fast decisions",
    ],
    isActive: true,
    leadPromise:
      "We send you qualified leads every month. Your job is to close them. If you have your own network to tap into, even better — 1.25x on those deals. Fewer leads than the full-time role since you're part-time.",
    payoutTimeline:
      "Get paid within 15 days after the customer's first invoice. No minimum payout thresholds. Your commission hits your account like clockwork.",
    earningsExample:
      "Earn on your own schedule. Close 2-3 Pro deals a month from our leads and you're making $150–$225 upfront plus building a residual base that grows every month. Add your own network at 1.25x and the per-deal earnings jump higher. The recurring commission is the real play here — deals you closed months ago still pay you while you're doing other things.",
    clawbackPolicy:
      "Clawback applies only to the recurring portion, not the upfront commission. 100% if customer cancels within 30 days, 75% within 90 days, 50% within 180 days. After 180 days, no clawback.",
  },
];

export function getJobBySlug(slug: string): Job | undefined {
  return JOBS.find((j) => j.isActive && j.slug === slug);
}

export function getActiveJobs(): Job[] {
  return JOBS.filter((j) => j.isActive);
}
