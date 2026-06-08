# CommissionKit: The Ultimate Sales Commission & Performance Platform

CommissionKit is an enterprise-grade solution designed to eliminate the complexity, errors, and manual labor associated with sales commission management. By automating the entire pipeline from deal ingestion to representative payouts, CommissionKit empowers sales-driven organizations to scale with confidence and total transparency.

---

## 1. Why CommissionKit?

Sales commissions are the engine of your business, but managing them in spreadsheets is a recipe for disaster. CommissionKit solves the three biggest challenges in sales operations:

- **Accuracy**: Eliminate "shadow accounting" and disputes by using a standardized, automated calculation engine.
- **Efficiency**: Save hundreds of hours every month by replacing manual data entry with high-speed automated runs.
- **Motivation**: Boost sales rep performance by providing them with instant, transparent visibility into their earnings and progress.

---

## 2. Commission Engine — Standard & Custom

CommissionKit's calculation engine is the heart of the platform. We ship with a powerful standard engine, and when your compensation model requires specialized logic, we build a custom engine that fits your business precisely.

### Standard Engine

Supports the three most common commission structures out of the box:

- **Flat Rate**: A single percentage applied to the entire deal amount. Simple, predictable, and ideal for straightforward compensation plans.
- **Tiered**: Configurable tiers with progressive rates based on deal amount thresholds. Reps earn higher percentages as they close larger deals.
- **Accelerator**: A base rate plus a higher "accelerator" rate that kicks in once a rep exceeds a configurable threshold within a period. Drives high performance with built-in motivation.

Every plan supports **clawback rules** — define a window (in days) where commissions are automatically reversed if a deal falls through, protecting your business from overpayment.

### Custom Engines for Complex Business Models

When your compensation model doesn't fit the standard mold, CommissionKit provides a **pluggable engine architecture** that allows us to deliver a fully custom calculation engine — without modifying the core platform.

Custom engines are built to your exact specifications. Examples include:

- **Slab + margin-matrix models**: Commission rates determined by a two-dimensional grid combining project size slabs and gross margin brackets.
- **Multi-variable compensation**: Calculations that factor in deal size, product category, contract length, region, or any combination of business-specific variables.
- **Revenue share / profit share**: Models that compute commissions based on net revenue or profit after costs rather than top-line deal amounts.
- **Hybrid models**: Any blend of base salary draw, guaranteed minimums, cap structures, and performance multipliers.

#### How It Works

1. **Discovery**: We analyze your existing compensation plans, spreadsheets, and business rules.
2. **Engine Development**: We build an isolated engine that slots into the platform's pluggable architecture. Your engine has access to its own data models, API routes, and frontend pages — fully separated from standard functionality.
3. **Configuration UI**: Where applicable, we provide admin-facing configuration screens (such as a commission matrix editor) so your team can adjust parameters without code changes.
4. **Deployment**: The engine is deployed as an integral part of your workspace. Only your workspace loads the custom engine; standard customers never see or pay for it.
5. **Ongoing Support**: As your business model evolves, we update the engine to match.

#### Isolation & Security

Custom engines run in complete data isolation:
- Separate database collections for engine-specific data.
- Lazy-loaded at runtime — standard workspaces never import custom engine code.
- Dedicated API routes and UI pages that only appear for matching workspaces.
- Built to scale to hundreds of enterprise clients with zero cross-contamination.

If our standard engine doesn't fit your business model, **we build one that does.**

---

## 3. Key Product Features

### Automated Commission Runs

Stop calculating commissions manually. With one click, CommissionKit processes thousands of deals, applies representative-specific rates, and generates comprehensive payout reports.

- **Asynchronous Processing**: Powered by BullMQ job queues for reliable, high-concurrency processing (5 concurrent workers with exponential backoff retry). Handle massive datasets without system slowdown.
- **Run Lifecycle Tracking**: Every run moves through `pending` → `processing` → `completed` (or `failed`) with full visibility.
- **Complete Audit Trail**: Maintain a perfect audit trail of every commission run ever performed, including per-deal calculation notes and exchange rate snapshots.
- **Admin Notifications**: Email and in-app notifications on run completion with summary statistics.

### Payouts Tracker & Disputes

Manage the final stage of the commission lifecycle with total accountability and trust. **(Growth plan and above)**

- **Payout Lifecycle**: Track every payment from `pending` → `approved` → `paid`, with `on_hold` and `disputed` states for exception handling.
- **Adjustments**: Add bonuses, deductions, or one-off adjustments to any payout with full history logging.
- **Bulk Operations**: Create, approve, or mark multiple payouts in a single action.
- **Complete Status History**: Every status change is timestamped and attributed to a specific user.
- **Dispute Resolution**: Reps can flag discrepancies directly from their portal. Admins review, comment, and resolve issues in a centralized dashboard. Disputes auto-update linked payout status on resolution.
- **CSV Export**: Export payouts for external payroll processing. **(Growth plan and above)**

### The Representative Portal (Transparency-First)

Empower your sales force with their own dedicated dashboard. Every rep gets a secure, personalized portal where they can:

- **View Real-Time Earnings**: See exactly how much they've earned and what is pending, with deal-by-deal breakdowns.
- **Track Performance**: Monitor deal volume, commission history, and trends over time.
- **Submit Disputes**: Flag discrepancies directly from within their portal without going through a manager.
- **Change Password**: Self-service credential management.
- **Secure Access**: Access their data via a unique portal link using JWT-based authentication — completely isolated from the admin dashboard's auth system. No complex logins or corporate credentials required.

### Enterprise Deal Management

A centralized hub for all your sales data.

- **Centralized Tracking**: Monitor every deal's status, amount, rep, close date, and payment status (`unpaid`, `paid`, `partial`, `on_hold`).
- **Deal Stages**: Track deals across `closed_won`, `closed_lost`, and `pending` stages.
- **Rep Assignments**: Easily assign or reassign deals to the correct sales personnel.
- **Granular Rates**: Assign specific commission plans per representative to match your unique compensation structures.
- **Auto-Clawback**: When a deal changes from won to lost within the plan's clawback window, commissions are automatically reversed and admins are notified.
- **Locked Editing**: Paid deals are protected from modification to preserve data integrity.

### Bulk Data Management (XLSX & CSV)

Streamline your operations with powerful data mobility features.

- **Bulk Import**: Effortlessly upload thousands of deals from Excel or CSV files using our intelligent field mapping system.
- **Flexible Templates**: Download ready-to-use templates to ensure your data is always perfectly formatted.
- **One-Click Export**: Export deals, commission results, and representative data to CSV for external auditing or internal record-keeping. **(Growth plan and above)**

### Universal Multi-Currency Support

CommissionKit is built for global teams. The platform provides **universal currency support** with 170+ currencies, allowing you to record deals, calculate commissions, and generate reports in any global currency.

- **Deal-Level Currencies**: Assign specific currencies to individual deals to match your international sales activities.
- **Exchange Rate Snapshots**: Commission runs capture exchange rates at the time of calculation for accurate, auditable conversions.
- **Workspace Base Currency**: All dashboards and reports automatically convert and display values in your workspace's base currency.
- **Dynamic Formatting**: Dashboards and reports adapt to display amounts in the correct currency format with `tabular-nums` for perfect financial alignment.

### Advanced Reporting & Analytics

Gain deep insights into your sales performance with our dedicated Reports engine.

- **Executive Summary**: Total revenue, total commission, margin percentage, win rate, average deal size, active deals, pending revenue, average days to close, and commission ratio.
- **Deal Stage Distribution**: Breakdown of won, lost, and pending deals.
- **Deal Value Distribution**: Bucketed analysis (Under $1K, $1K–$5K, $5K–$25K, $25K–$100K, Over $100K).
- **Payment Status Breakdown**: Track unpaid, paid, partial, and on-hold balances across your pipeline.
- **Monthly Trends**: Revenue, commission, and deal volume trends over time with growth rate calculations.
- **Top Performers**: Leaderboards ranked by revenue, commission, and win rate.
- **Top Deals**: Largest deals by amount for quick visibility.
- **Rep Drill-Down**: Individual rep summaries with deal-by-deal breakdowns and monthly commission history (12-month view).
- **Filterable**: Filter reports by date range and aggregation interval (daily or monthly).
- **Deduplicated Analytics**: Intelligent calculation logic ensures reports are accurate and free of double-counting, even with complex data.

### Professional Team Workspaces

Built for collaboration and growth.

- **Multi-Tenant Architecture**: Securely manage multiple independent workspaces with complete data isolation.
- **Role-Based Access Control (RBAC)**: Three built-in system roles (Owner, Admin, Member) plus fully customizable roles with granular permissions in `resource:action` format (e.g., `deals:read`, `payouts:approve`, `reps:create`). Wildcard support for super-admin access.
- **Permission Caching**: Redis-backed permission cache with automatic invalidation for high-performance authorization.
- **Easy Onboarding**: Invite new team members with a single email invitation. Pending invitations auto-accept when the invited user signs in.

### Integrations & Connectors

CommissionKit plugs directly into the tools you already use — no manual data entry, no spreadsheets. Native connectors sync your sales reps and deals automatically from your ERP or CRM.

**Native Connectors:**

- **Odoo ERP** — Syncs sales reps (`res.users`) and confirmed sales orders (`sale.order`). Maps Odoo states to CKit stages, resolves payment status from actual invoice data (not just invoice status), and supports all major currencies. Works with Odoo 15+ Community and Enterprise.
- **HubSpot CRM** — Syncs owners as reps and deals by pipeline stage. Auto-discovers your pipeline stages and fetches payment-relevant metadata. Works with Service Keys or Legacy App tokens.
- **Custom REST API** — Connect any ERP or CRM that exposes a REST API. Configure authentication (Bearer, API Key, Basic Auth), field mappings via JSONPath, pagination (offset, cursor, page), and stage/payment status mappings — all through a JSON config. Supports `$div` compute fields for fractional amounts (e.g., micros → dollars).

**Sync Capabilities:**

- **Scheduled auto-sync** — Pull updates every 10 minutes, hourly, daily, or on-demand
- **Hash-based change detection** — Only syncs records that actually changed in the source system
- **Stage mapping** — Customize how your system's stages map to CKit stages (HubSpot)
- **Field mapping** — JSONPath-based extraction from any response shape (Custom REST)
- **Dedicated sync workers** — BullMQ-powered background processing with retry and error tracking
- **Sync history** — Full audit trail of every sync with created/updated/skipped/failed counts

For ERPs or CRMs not in the list above, our team builds custom connectors on demand.

Stay informed with a real-time notification system.

- **Commission Run Completions**: Know exactly when batch calculations finish.
- **Clawback Alerts**: Immediately notified when commissions are reversed.
- **Payout & Dispute Updates**: Track status changes and resolutions.
- **Team Activity**: Notifications for member invitations, role changes, and plan updates.
- **Notification Bell**: Badge count in the dashboard header with mark-as-read and dismiss actions.
- **Email + In-App**: Configure per-event-type preferences for both channels.

---

## 4. Reliability & Security

CommissionKit is built for modern business requirements:

- **Data Isolation**: Each workspace is strictly isolated at the database level, ensuring your proprietary sales data is never mixed or exposed.
- **High Availability**: Optimized for speed and uptime. API runs on Express 5 with request-level logging and Sentry error monitoring.
- **Scalable Infrastructure**: BullMQ-powered background processing with Redis ensures the platform scales from a team of five to an organization of thousands without performance degradation.
- **Audit Trails**: Every commission run, payout status change, and dispute resolution is fully tracked and attributable.
- **Better Auth**: Industry-standard authentication with email/password, session management, password reset, and email verification flows.

---

## 5. The Result: A Motivated, High-Performance Sales Team

By removing the friction of commission management, CommissionKit allows your leadership to focus on strategy and your sales reps to focus on what they do best: **closing deals.**

When our standard engine isn't the right fit, we don't force your business into a box — we build a custom engine that matches how you actually operate. Your compensation model should drive your software, not the other way around.

---

**CommissionKit — Automate. Motivate. Scale.**
