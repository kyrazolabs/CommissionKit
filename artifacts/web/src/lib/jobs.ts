export interface Job {
  slug: string;
  title: string;
  department: string;
  location: string;
  type: "contract" | "full-time" | "part-time";
  description: string;
  responsibilities: string[];
  requirements: string[];
  offers: string[];
  isActive: boolean;
}

export const JOBS: Job[] = [
  {
    slug: "sales-representative",
    title: "Sales Representative",
    department: "Sales",
    location: "Remote",
    type: "contract",
    description:
      "We're looking for independent sales contractors to help us grow CommissionKit across the GCC and beyond. You'll sell our commission management platform to SMBs and enterprises who are tired of spreadsheet chaos.",
    responsibilities: [
      "Generate and qualify leads through outbound outreach, networking, and referrals",
      "Run product demos and articulate CommissionKit's value proposition to finance and sales leaders",
      "Close deals and manage the sales cycle from first contact to signed contract",
      "Maintain accurate records in our CRM and report on pipeline weekly",
      "Provide feedback from prospects to help shape our product roadmap",
    ],
    requirements: [
      "3+ years of B2B sales experience, preferably in SaaS or fintech",
      "Self-motivated and comfortable working independently in a remote environment",
      "Excellent written and verbal communication skills",
      "Familiarity with CRM tools (HubSpot, Salesforce, or similar)",
      "Existing network of decision-makers in HR, Finance, or Sales Operations is a plus",
    ],
    offers: [
      "30% commission on the customer's first invoice",
      "10% lifetime recurring commission for the duration of the customer relationship",
      "Flexible schedule — work on your own hours",
      "Fully remote — work from anywhere",
      "Demo accounts, sales collateral, and training materials provided",
      "Direct access to founding team for support and fast decisions",
    ],
    isActive: true,
  },
];

export function getJobBySlug(slug: string): Job | undefined {
  return JOBS.find((j) => j.isActive && j.slug === slug);
}

export function getActiveJobs(): Job[] {
  return JOBS.filter((j) => j.isActive);
}
