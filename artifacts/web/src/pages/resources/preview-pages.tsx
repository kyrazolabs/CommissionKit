import type { PreviewContentDefinition } from "./preview-content-page";
import { PreviewContentPage } from "./preview-content-page";

const definitions: Record<string, PreviewContentDefinition> = {
  calculators: {
    path: "/calculators",
    eyebrow: "Calculator hub",
    title: "Sales commission calculators",
    answer:
      "A commission calculator should make its inputs, formula, and assumptions clear before it produces a result. This preview hub organizes the calculation pages CommissionKit plans to publish after editorial review.",
    description:
      "The live CommissionKit calculator currently supports flat, tiered, and accelerator structures. This preview hub is a content architecture proposal, not a new calculation engine or a published resource library.",
    schemaType: "CollectionPage",
    sections: [
      {
        heading: "How to use a commission calculator responsibly",
        paragraphs: [
          "Start with the crediting event, the eligible amount, the rate or rate tiers, and any attainment threshold. A result is only as reliable as those inputs and the written plan it is meant to represent.",
          "The published version of each calculator page should show its formula and a simple worked example. It should also link to the relevant plan-design guidance instead of implying that one formula applies to every sales team.",
        ],
        bullets: [
          "Confirm whether commission is based on bookings, revenue, margin, cash received, or another defined measure.",
          "Document the tier boundaries and whether rates are marginal or applied to the entire eligible amount.",
          "Record how splits, accelerators, clawbacks, and plan changes are handled before relying on a calculation.",
        ],
      },
      {
        heading: "What CommissionKit can help teams operationalize",
        paragraphs: [
          "CommissionKit documents support for flat, tiered, and accelerator plans, calculation runs, payout workflows, and rep-level visibility. Teams should validate their plan configuration and connected source data before using results for payment decisions.",
        ],
      },
    ],
    related: [
      {
        href: "/calculator",
        label: "Live commission calculator",
        description: "Use the current flat, tiered, and accelerator calculator.",
      },
      {
        href: "/calculators/tiered-commission",
        label: "Tiered calculator preview",
        description: "Review the planned answer-first tiered-calculation page.",
      },
      {
        href: "/guides/sales-commission-structures",
        label: "Commission structures preview",
        description: "Review the planned plan-design pillar.",
      },
      {
        href: "/templates",
        label: "Template hub preview",
        description: "Review the planned planning-template architecture.",
      },
    ],
    faqs: [
      {
        question: "Are these preview calculators ready to use?",
        answer:
          "No. The preview pages document the planned information architecture and remain noindex until calculation logic, copy, and any downloadable assets are approved.",
      },
      {
        question: "Can a calculator replace a commission plan?",
        answer:
          "No. A calculator can illustrate a stated formula, but the written plan needs to define eligibility, crediting, timing, exceptions, and governance.",
      },
    ],
  },
  tieredCommission: {
    path: "/calculators/tiered-commission",
    eyebrow: "Calculator preview",
    title: "Tiered commission calculator",
    answer:
      "A tiered commission calculator estimates earnings by applying defined rates across attainment or revenue ranges. Whether the tiers are marginal or retroactive must be stated before the result can be interpreted.",
    description:
      "This preview explains the planned tiered-calculation page and links to the current CommissionKit calculator. It is not a substitute for a reviewed plan or a payroll instruction.",
    schemaType: "WebPage",
    parent: {
      href: "/calculators",
      label: "Sales commission calculators",
      description: "Preview calculator hub.",
    },
    sections: [
      {
        heading: "A worked planning example",
        paragraphs: [
          "Suppose a plan has two marginal tiers: 5% on the first 10,000 of eligible amount and 8% on the next 10,000. At 15,000 of eligible amount, the illustration applies 5% to the first 10,000 and 8% to the remaining 5,000.",
          "This is only a simple example. A production page must state the currency, crediting event, payout timing, and plan-specific exceptions before it can be used in a payment workflow.",
        ],
      },
      {
        heading: "Questions to settle before configuring tiers",
        paragraphs: [
          "Teams should agree on the data source, the plan period, the attainment measure, and what happens if a deal changes after a calculation run. These questions matter as much as the rate table itself.",
        ],
        bullets: [
          "Does each rate apply only to the amount within its tier, or to the entire eligible amount after a threshold?",
          "Are renewal, expansion, multi-year, or shared deals treated differently?",
          "What is the review path when source data, ownership, or a payment status changes?",
        ],
      },
    ],
    related: [
      {
        href: "/calculator",
        label: "Live commission calculator",
        description: "Use the current calculator for a flat, tiered, or accelerator illustration.",
      },
      {
        href: "/guides/sales-commission-structures",
        label: "Commission structures preview",
        description: "Compare the common plan models before selecting a calculator.",
      },
      {
        href: "/templates/sales-commission-plan",
        label: "Plan template preview",
        description: "Review the planned documentation checklist for a commission plan.",
      },
    ],
    faqs: [
      {
        question: "What is a marginal tier?",
        answer:
          "A marginal tier applies a rate only to the amount that falls within that tier. The first tier remains calculated at its own rate.",
      },
      {
        question: "What is a retroactive tier?",
        answer:
          "A retroactive tier applies a higher rate to an earlier amount once a threshold is reached. The written plan should state this explicitly.",
      },
    ],
  },
  templates: {
    path: "/templates",
    eyebrow: "Template hub",
    title: "Sales commission plan templates",
    answer:
      "A useful commission-plan template makes the decision points visible: eligibility, crediting, rate mechanics, timing, approvals, change control, and how questions are resolved. This preview hub proposes a reviewed template library rather than offering unapproved legal or compensation documents.",
    description:
      "The template architecture is designed to connect plan design with a calculator, product configuration, and review workflows. No downloadable template is included in this preview.",
    schemaType: "CollectionPage",
    sections: [
      {
        heading: "What a reviewed template should include",
        paragraphs: [
          "The eventual template library should distinguish between an internal plan-design worksheet, a policy summary, and any agreement or employment-related document. These serve different purposes and should not be treated as interchangeable.",
        ],
        bullets: [
          "Business goal, covered roles, effective dates, and plan owner.",
          "Eligibility and crediting definitions tied to the source-of-truth data.",
          "Rate tables, tiers, accelerators, splits, caps, draws, and clawback conditions where applicable.",
          "Approval, communication, versioning, and dispute-resolution workflow.",
        ],
      },
      {
        heading: "Why this remains preview-only",
        paragraphs: [
          "Compensation, agreement, tax, employment, and payroll requirements vary by jurisdiction and company. Publication needs content-owner, legal, and compensation review, plus confirmation of any downloadable format or lead-capture experience.",
        ],
      },
    ],
    related: [
      {
        href: "/templates/sales-commission-plan",
        label: "Plan template preview",
        description: "Review the planned plan-template guidance.",
      },
      {
        href: "/guides/sales-commission-structures",
        label: "Commission structures preview",
        description: "Understand plan mechanics before using a template.",
      },
      {
        href: "/calculators",
        label: "Calculator hub preview",
        description: "Explore the planned calculation content architecture.",
      },
    ],
    disclaimer:
      "This preview is educational. It does not provide legal, tax, payroll, employment, or compensation advice.",
  },
  salesCommissionPlanTemplate: {
    path: "/templates/sales-commission-plan",
    eyebrow: "Template preview",
    title: "Sales commission plan template",
    answer:
      "A sales commission plan template should turn compensation decisions into a versioned operating document. It should explain what is rewarded, which data counts, how rates apply, when payment is reviewed, and what happens when circumstances change.",
    description:
      "This preview outlines the proposed page and review checklist. It does not provide a downloadable agreement, policy, or legal form.",
    schemaType: "WebPage",
    parent: {
      href: "/templates",
      label: "Sales commission plan templates",
      description: "Preview template hub.",
    },
    sections: [
      {
        heading: "Plan-design checklist",
        paragraphs: [
          "The template should begin with a plain-language summary that a representative, manager, and Finance reviewer can read consistently. Detailed mechanics can then follow in labelled sections rather than being hidden in a spreadsheet formula.",
        ],
        bullets: [
          "Plan period, covered role, plan owner, and effective date.",
          "Eligibility, crediting rule, source system, and treatment of changes or cancellations.",
          "Payout timing, approval steps, exception process, and version history.",
        ],
      },
      {
        heading: "Implementation review",
        paragraphs: [
          "Before a plan is configured in software, the plan owner should confirm that every stated term can be represented in the calculation logic and the source data is sufficient to support it. Any gap should be resolved in the plan, not silently handled by a manual adjustment.",
        ],
      },
    ],
    related: [
      {
        href: "/guides/sales-commission-structures",
        label: "Commission structures preview",
        description: "Compare core plan models.",
      },
      {
        href: "/calculators/tiered-commission",
        label: "Tiered calculator preview",
        description: "See the questions required to model tiers.",
      },
      {
        href: "/features",
        label: "CommissionKit features",
        description: "Review plan, calculation, payout, and rep-visibility capabilities.",
      },
    ],
    disclaimer:
      "This preview is not an employment agreement, compensation policy, payroll instruction, or legal advice. Specialist review is required before use.",
  },
  salesCommissionStructures: {
    path: "/guides/sales-commission-structures",
    eyebrow: "Plan-design guide preview",
    title: "Sales commission structures explained",
    answer:
      "Sales commission structures define how a team earns variable pay. Flat-rate, tiered, and accelerator structures are common starting points, but the correct design depends on the sales motion, data, governance, and written plan.",
    description:
      "This preview is the proposed pillar for plan mechanics. It frames key structure choices without claiming that one design is appropriate for every team.",
    schemaType: "Article",
    sections: [
      {
        heading: "Common structure patterns",
        paragraphs: [
          "A flat-rate structure applies a defined rate to an eligible amount. A tiered structure uses different rates across ranges or attainment thresholds. An accelerator increases the rate after a stated threshold is met.",
          "Some plans also use splits, overrides, draws, caps, or clawback rules. These should be defined in plain language, represented in the data model, and reviewed before a calculation run is approved.",
        ],
      },
      {
        heading: "Design the operating controls, not just the rate",
        paragraphs: [
          "A plan is easier to administer when teams agree on source data, owners, period close, adjustment handling, approval, and representative visibility. The plan documents the rule; the operational workflow helps the team apply it consistently.",
        ],
        bullets: [
          "Set a clear crediting event and identify the source system used to verify it.",
          "Define who may approve changes and how a revision is communicated.",
          "Make calculation inputs and payout status visible to the people who need to review them.",
        ],
      },
    ],
    related: [
      {
        href: "/calculators",
        label: "Calculator hub preview",
        description: "Explore the proposed calculator content system.",
      },
      {
        href: "/templates/sales-commission-plan",
        label: "Plan template preview",
        description: "Review a documented-plan checklist.",
      },
      {
        href: "/glossary",
        label: "Glossary preview",
        description: "Review proposed definitions for plan terminology.",
      },
      {
        href: "/features",
        label: "CommissionKit features",
        description: "Review verified plan, calculation, payout, and portal features.",
      },
    ],
    faqs: [
      {
        question: "What is a flat-rate commission structure?",
        answer: "It applies one defined rate to the eligible amount described in the plan.",
      },
      {
        question: "What is an accelerator?",
        answer:
          "An accelerator is a higher rate that applies after a stated threshold, subject to the plan's specific rules.",
      },
    ],
  },
  salesforceAnswer: {
    path: "/guides/does-salesforce-calculate-commissions",
    eyebrow: "Integration answer preview",
    title: "Does Salesforce calculate commissions?",
    answer:
      "Salesforce can store opportunity and ownership data that teams use in a commission workflow. CommissionKit's Salesforce connector is designed to sync users as reps and opportunities as deals so teams can configure plans, run calculations, and manage payouts in CommissionKit.",
    description:
      "This preview is the planned direct-answer page for Salesforce commission-tracking questions. Product and Salesforce review are required before the page can be indexed.",
    schemaType: "Article",
    parent: {
      href: "/integrations/salesforce",
      label: "Salesforce integration",
      description: "Published Salesforce integration page.",
    },
    sections: [
      {
        heading: "Separate source data from calculation rules",
        paragraphs: [
          "A reliable commission process separates the CRM record from the written plan and calculation workflow. The CRM can provide source fields such as opportunities, owners, amounts, and stages. The plan defines which fields are eligible, how credit is allocated, and when payouts are reviewed.",
        ],
      },
      {
        heading: "A reviewable workflow",
        paragraphs: [
          "The published version should explain the documented connector workflow: connect Salesforce, map the relevant stage behavior, sync users and opportunities, configure plans, run calculations, review results, and manage payout status. It should link to the exact setup guide rather than substitute marketing copy for implementation instructions.",
        ],
      },
    ],
    related: [
      {
        href: "/integrations/salesforce",
        label: "Salesforce integration",
        description: "Review the published integration page and setup link.",
      },
      {
        href: "/calculators",
        label: "Calculator hub preview",
        description: "Review the planned calculator architecture.",
      },
      {
        href: "/guides/sales-commission-structures",
        label: "Commission structures preview",
        description: "Review plan mechanics before configuring a workflow.",
      },
    ],
    faqs: [
      {
        question: "What data can the Salesforce connector sync?",
        answer:
          "CommissionKit documents that the connector syncs Salesforce users as reps and opportunities as deals. Confirm the required mappings during setup.",
      },
      {
        question: "Does a CRM record replace a written commission plan?",
        answer:
          "No. The plan needs to define eligibility, crediting, timing, exceptions, and review controls in addition to the source data.",
      },
    ],
  },
  buyerGuide: {
    path: "/guides/best-commission-management-software",
    eyebrow: "Buyer-guide preview",
    title: "How to evaluate commission management software",
    answer:
      "A commission management software evaluation should start with the team's plan complexity, source data, control needs, and review workflow. A useful buyer guide explains its method and criteria instead of presenting unsupported rankings or vendor claims.",
    description:
      "This preview is the planned decision-stage guide. It intentionally avoids vendor rankings, customer stories, outcome claims, and comparison assertions until a reviewed methodology is approved.",
    schemaType: "Article",
    sections: [
      {
        heading: "Evaluation criteria to document",
        paragraphs: [
          "The eventual guide should help teams describe their requirements before looking at vendors. It should give equal weight to calculation representability, data integrity, user roles, auditability, integration requirements, and implementation support.",
        ],
        bullets: [
          "Commission-plan complexity and whether formulas, tiers, splits, accelerators, adjustments, and historical changes can be represented.",
          "Source-system coverage, mapping controls, sync reliability, and access to the underlying records used in a calculation.",
          "Review, approval, payout, dispute, reporting, and representative-visibility requirements.",
        ],
      },
      {
        heading: "Why no vendor list is published in this preview",
        paragraphs: [
          "A comparison or 'best' list needs a documented method, current product verification, clear editorial ownership, and legal review. The route remains a noindex preview until those requirements are complete.",
        ],
      },
    ],
    related: [
      {
        href: "/features",
        label: "CommissionKit features",
        description: "Review published product capabilities.",
      },
      {
        href: "/pricing",
        label: "Pricing",
        description: "Review current published plan information.",
      },
      {
        href: "/guides/sales-commission-structures",
        label: "Commission structures preview",
        description: "Review plan-design considerations.",
      },
    ],
    disclaimer:
      "A published comparison requires a dated methodology, vendor fact-checking, and legal/editorial approval. This preview contains no ranking or endorsement.",
  },
  glossary: {
    path: "/glossary",
    eyebrow: "Glossary hub",
    title: "Sales commission glossary",
    answer:
      "A sales commission glossary gives Finance, RevOps, sales leaders, and representatives a shared language for plan terms. Each published definition should use one canonical term, a concise explanation, and a concrete example checked against the plan context.",
    description:
      "This preview proposes a glossary architecture. Definitions remain noindex until subject-matter and editorial review has confirmed their use and examples.",
    schemaType: "CollectionPage",
    sections: [
      {
        heading: "How glossary content will be governed",
        paragraphs: [
          "Terms will be published as individual canonical pages only when they have a clear standalone question and a reviewed definition. Similar terms should cross-link rather than compete for the same intent.",
          "Every page should distinguish a general concept from company-specific plan language. The glossary cannot override the written commission plan.",
        ],
      },
      {
        heading: "Initial term set",
        paragraphs: [
          "The initial planned terms include on-target earnings, pay mix, tier, accelerator, commission split, draw, clawback, crediting, quota, and true-up. Publication priority should be based on validated query and product data, not assumed demand.",
        ],
      },
    ],
    related: [
      {
        href: "/glossary/ote",
        label: "OTE meaning preview",
        description: "Review the proposed on-target-earnings definition page.",
      },
      {
        href: "/guides/sales-commission-structures",
        label: "Commission structures preview",
        description: "Review the planned plan-design pillar.",
      },
      {
        href: "/templates",
        label: "Template hub preview",
        description: "Review the planned template architecture.",
      },
    ],
  },
  ote: {
    path: "/glossary/ote",
    eyebrow: "Glossary preview",
    title: "OTE meaning in sales",
    answer:
      "OTE means on-target earnings. It is commonly used to describe the total compensation a sales role may earn when the stated performance target is achieved under the applicable plan.",
    description:
      "This preview provides a concise definition and a planning example. It is not an offer, earnings guarantee, compensation policy, or payroll instruction.",
    schemaType: "DefinedTerm",
    parent: {
      href: "/glossary",
      label: "Sales commission glossary",
      description: "Preview glossary hub.",
    },
    sections: [
      {
        heading: "How OTE is usually expressed",
        paragraphs: [
          "A plan may describe OTE as base pay plus target variable pay. For example, a role might have a stated base component and a stated target incentive component. The actual calculation, eligibility, and timing must come from the written plan and employment terms.",
        ],
      },
      {
        heading: "Questions a plan should answer",
        paragraphs: [
          "A clear plan should explain which results count toward target, how attainment is measured, how changes are handled, and whether there are caps, thresholds, draws, or clawbacks. OTE alone does not answer those questions.",
        ],
      },
    ],
    related: [
      {
        href: "/guides/sales-commission-structures",
        label: "Commission structures preview",
        description: "Review the broader plan-design guide.",
      },
      {
        href: "/templates/sales-commission-plan",
        label: "Plan template preview",
        description: "Review a plan-documentation checklist.",
      },
      {
        href: "/calculators",
        label: "Calculator hub preview",
        description: "Review the planned calculation content architecture.",
      },
    ],
    disclaimer:
      "This educational preview is not a compensation promise, employment term, payroll instruction, or legal advice.",
  },
  commissionAccounting: {
    path: "/finance/commissions-accounting",
    eyebrow: "Finance and RevOps preview",
    title: "Sales commission accounting considerations",
    answer:
      "Sales commission accounting requires teams to connect plan terms, source records, calculation outputs, approvals, and payout status into a reviewable process. Accounting treatment depends on the facts, applicable standards, and professional judgement.",
    description:
      "This preview outlines a Finance and RevOps content hub covering records, controls, and review questions. It does not provide accounting, tax, audit, payroll, or legal advice.",
    schemaType: "Article",
    sections: [
      {
        heading: "A control-oriented operating record",
        paragraphs: [
          "The published guide should focus on evidence a Finance or RevOps team may need to review: the plan version, source data, calculation inputs and results, approver actions, adjustment rationale, and payout status. A software workflow should make those records easier to trace; it should not replace professional accounting judgement.",
        ],
        bullets: [
          "Identify the plan version and effective dates used in each calculation run.",
          "Retain the source records and rationale for overrides, disputes, changes, or reversals.",
          "Define a review and approval process before a payout is marked paid.",
        ],
      },
      {
        heading: "ASC 606 and IFRS 15 require expert review",
        paragraphs: [
          "The supplied research identifies ASC 606 commission accounting and IFRS 15 sales commissions as target discovery terms. A public educational page on these standards requires authoritative sources and qualified accounting review before it can make statements about recognition, amortisation, policy, or compliance.",
        ],
      },
    ],
    related: [
      {
        href: "/features",
        label: "CommissionKit features",
        description: "Review published plan, calculation, payout, and rep-visibility capabilities.",
      },
      {
        href: "/integrations/custom",
        label: "Custom REST API integration",
        description: "Review published data-mapping and connector information.",
      },
      {
        href: "/guides/sales-commission-structures",
        label: "Commission structures preview",
        description: "Review the plan-design content proposal.",
      },
    ],
    disclaimer:
      "This route remains noindex until accounting, tax, legal, and editorial reviewers approve the final educational content and sources.",
  },
  globalSalesCommissions: {
    path: "/solutions/global-sales-commissions",
    eyebrow: "Solution preview",
    title: "Global sales commission management",
    answer:
      "Global sales commission management requires a team to define plan rules, currency handling, source data, review controls, and the local professional advice needed for payroll, tax, employment, and legal obligations. CommissionKit documents multi-currency calculation support using exchange-rate snapshots.",
    description:
      "This preview is the planned solution page for global sales-commission operations. It does not make jurisdiction-specific tax, payroll, employment, or legal claims.",
    schemaType: "WebPage",
    parent: { href: "/solutions", label: "Solutions", description: "Published solution overview." },
    sections: [
      {
        heading: "Questions global teams need to resolve",
        paragraphs: [
          "The solution should help a team identify operational requirements without suggesting a one-size-fits-all approach. Currency conversion, employment terms, timing, data residency, and local payroll processes should be confirmed with the relevant owners and advisers.",
        ],
        bullets: [
          "Which source currency, rate source, snapshot date, and reporting currency are used for each calculation?",
          "Which plan version and local employment or payroll process applies to each covered representative?",
          "Who reviews exceptions, data changes, and payout approval across regions?",
        ],
      },
      {
        heading: "What needs product confirmation before publication",
        paragraphs: [
          "The final route must be reviewed against the current multi-currency workflow, supported locations, integration availability, security documentation, and the precise product terms. It must not imply local payroll, tax, or compliance services.",
        ],
      },
    ],
    related: [
      {
        href: "/features",
        label: "CommissionKit features",
        description: "Review published platform capabilities.",
      },
      {
        href: "/finance/commissions-accounting",
        label: "Accounting preview",
        description: "Review the Finance and RevOps content proposal.",
      },
      {
        href: "/integrations/odoo",
        label: "Odoo integration",
        description: "Review a published integration page.",
      },
    ],
    disclaimer:
      "This preview is not tax, payroll, employment, legal, accounting, or regulatory advice. Product and regional review are required before publication.",
  },
};

export function CalculatorsHubPage() {
  return <PreviewContentPage definition={definitions.calculators} />;
}
export function TieredCommissionCalculatorPage() {
  return <PreviewContentPage definition={definitions.tieredCommission} />;
}
export function TemplatesHubPage() {
  return <PreviewContentPage definition={definitions.templates} />;
}
export function SalesCommissionPlanTemplatePage() {
  return <PreviewContentPage definition={definitions.salesCommissionPlanTemplate} />;
}
export function SalesCommissionStructuresPage() {
  return <PreviewContentPage definition={definitions.salesCommissionStructures} />;
}
export function SalesforceCommissionAnswerPage() {
  return <PreviewContentPage definition={definitions.salesforceAnswer} />;
}
export function CommissionSoftwareBuyerGuidePage() {
  return <PreviewContentPage definition={definitions.buyerGuide} />;
}
export function GlossaryHubPage() {
  return <PreviewContentPage definition={definitions.glossary} />;
}
export function OteGlossaryPage() {
  return <PreviewContentPage definition={definitions.ote} />;
}
export function CommissionAccountingPage() {
  return <PreviewContentPage definition={definitions.commissionAccounting} />;
}
export function GlobalSalesCommissionsPage() {
  return <PreviewContentPage definition={definitions.globalSalesCommissions} />;
}
