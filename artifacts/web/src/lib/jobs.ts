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
}

export const JOBS: Job[] = [
  {
    slug: "sales-representative",
    title: "SaaS Sales Representative (Commission-Based)",
    department: "Sales",
    location: "Remote",
    type: "contract",
    schedule: "full-time",
    description:
      "We're looking for independent sales contractors to sell CommissionKit to SMBs and enterprises tired of managing commissions in spreadsheets. We provide qualified leads. You close them. No cold calling unless you want to.",
    responsibilities: [
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
      "30% commission on the customer's first invoice",
      "10% lifetime recurring commission — as long as the customer stays, you get paid",
      "Payout within 15 days after first invoice. No minimums. No delays.",
      "Flexible schedule. Work when you want.",
      "Fully remote. Work from wherever.",
      "We give you demo accounts, sales decks, and training. You're not figuring this out alone.",
      "Direct access to founding team for support and fast decisions",
    ],
    isActive: true,
    leadPromise:
      "We send you 10+ qualified leads every month. These are people who've already shown interest. Your job is to close them. If you have your own network you want to tap into too, even better.",
    payoutTimeline:
      "Get paid within 15 days after the customer's first invoice. No minimum payout thresholds. Your commission hits your account like clockwork.",
    earningsExample:
      "Top reps make $3,000–$8,000/month. Here's the math: close 5 Pro deals at $249/mo and you get $373.50 upfront plus $124.50 every month after. Close 10 Growth deals at $99/mo and that's $297 upfront plus $99/month recurring. The real money comes from stacking — deals you closed in January still pay you in June.",
  },
  {
    slug: "sales-representative-part-time",
    title: "SaaS Sales Representative (Commission-Based, Part-Time)",
    department: "Sales",
    location: "Remote",
    type: "contract",
    schedule: "part-time",
    description:
      "We're looking for part-time independent sales contractors to sell CommissionKit. If you want commission-only side income without giving up your day job or your schedule, this is built for that. We provide qualified leads. You close them. No cold calling unless you want to.",
    responsibilities: [
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
      "30% commission on the customer's first invoice",
      "10% lifetime recurring commission — as long as the customer stays, you get paid",
      "Payout within 15 days after first invoice. No minimums. No delays.",
      "Flexible hours — work when it fits your life, not the other way around",
      "Fully remote. Anywhere in the world.",
      "We give you demo accounts, sales decks, and training. You're not figuring this out alone.",
      "Direct access to founding team for support and fast decisions",
    ],
    isActive: true,
    leadPromise:
      "We send you qualified leads every month. Your job is to close them. If you have your own network to tap into, even better. Fewer leads than the full-time role since you're part-time.",
    payoutTimeline:
      "Get paid within 15 days after the customer's first invoice. No minimum payout thresholds. Your commission hits your account like clockwork.",
    earningsExample:
      "On your own schedule. Close 2 Pro deals at $249/mo and make $149.40 upfront plus $49.80/month. Close 5 Growth deals at $99/mo for $148.50 upfront plus $49.50/month. The beauty of recurring commission: every month your deals keep paying you, even while you're doing other things.",
  },
];

export function getJobBySlug(slug: string): Job | undefined {
  return JOBS.find((j) => j.isActive && j.slug === slug);
}

export function getActiveJobs(): Job[] {
  return JOBS.filter((j) => j.isActive);
}
