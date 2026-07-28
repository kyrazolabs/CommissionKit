# 🪙 CommissionKit

**CommissionKit** is a robust, premium SaaS platform for modern sales teams to track commissions, manage sales quotas, and handle payouts. It helps B2B sales teams (5–100+ reps) import deals via CSV, model flat/tiered/accelerator commission plans, execute calculation runs, and provide representatives with an elegant personal earnings dashboard and audit trail.

---

## 🏗️ Monorepo Architecture

This project is organized as a high-performance monorepo using **Bun Workspaces**:

### 📱 Applications & Services (`artifacts/`)
*   **[web](file:///home/nxion/The%20Forge/Projects/SaaS/CommissionKit/artifacts/web)**: Beautiful, responsive React 19 + Vite single-page application. Features a state-of-the-art landing page, dynamic annual/monthly pricing calculator, interactive billing portal, and clean analytics interfaces.
*   **[api](file:///home/nxion/The%20Forge/Projects/SaaS/CommissionKit/artifacts/api)**: High-throughput Express 5 backend server. Handles Stripe checkout/billing flows, 14-day free trials, webhooks, analytics, calculations, and secure token-less authentication via Better Auth.

### 📦 Shared Libraries (`lib/`)
*   **[db](file:///home/nxion/The%20Forge/Projects/SaaS/CommissionKit/lib/db)**: Database layer using **MongoDB** & **Mongoose** schemas for workspaces, user subscriptions, commission runs, deals, and payouts.
*   **[queue](file:///home/nxion/The%20Forge/Projects/SaaS/CommissionKit/lib/queue)**: Asynchronous job queue powered by **BullMQ** and **Redis** for worker tasks (e.g. SMTP email delivery, background commission calculation, and exchange rate syncing).
*   **[email-templates](file:///home/nxion/The%20Forge/Projects/SaaS/CommissionKit/lib/email-templates)**: Clean, professional React-based SMTP transactional email templates.
*   **[api-spec](file:///home/nxion/The%20Forge/Projects/SaaS/CommissionKit/lib/api-spec)**: OpenAPI specs and [Orval](https://orval.dev/) code generation configuration.
*   **[api-zod](file:///home/nxion/The%20Forge/Projects/SaaS/CommissionKit/lib/api-zod)**: Shared Zod validators parsed directly from OpenAPI specifications.
*   **[api-client-react](file:///home/nxion/The%20Forge/Projects/SaaS/CommissionKit/lib/api-client-react)**: Auto-generated React Query fetchers used by the React SPA.

---

## ⚡ Tech Stack

*   **Runtime / Package Manager**: [Bun](https://bun.sh/)
*   **Frontend**: React 19 + Vite + Tailwind CSS + TanStack React Query + Lucide Icons + Wouter
*   **Backend**: Express 5 + Better Auth
*   **Database**: MongoDB + Mongoose
*   **Background Jobs & Queues**: Redis + BullMQ
*   **API Validation & Codegen**: OpenAPI 3.0 + Zod + Orval
*   **Email Dispatch**: SMTP-compatible configurations with BullMQ queue dispatch

---

## ⚙️ Prerequisites & Infrastructure

Before running the application, make sure you have the following services active on your system:

1.  **Bun**: Ensure you have Bun installed (`bun --version`).
2.  **Node.js 24**: Required for certain background dev scripts and build tooling.
3.  **MongoDB**: A local MongoDB database instance (defaulting to `mongodb://localhost:27017/commissionkit`) or a hosted connection string.
4.  **Redis**: A running Redis instance (`redis://localhost:6379`) to host job queues.

---

## 🔑 Environment Variables

To get started, duplicate the `.env.example` file in the root directory:

```bash
cp artifacts/api/.env.example artifacts/api/.env
cp artifacts/web/.env.example artifacts/web/.env
```

### Essential Backend Configuration (`artifacts/api/.env`)
*   `MONGO_URL`: Your MongoDB connection string (e.g., `mongodb://localhost:27017/commissionkit`).
*   `REDIS_URL`: Redis server URL (e.g., `redis://localhost:6379`).
*   `SESSION_SECRET` & `BETTER_AUTH_SECRET`: Strong secret keys used to secure user sessions.
*   `STRIPE_SECRET_KEY` & `STRIPE_WEBHOOK_SECRET`: Secure integrations for SaaS payment logic.
*   `STRIPE_STARTER_PRICE_ID`, `STRIPE_GROWTH_PRICE_ID`, `STRIPE_PRO_PRICE_ID` (and respective `_ANNUAL_` variants): Standard Stripe pricing IDs.

### Essential Frontend Configuration (`artifacts/web/.env`)
*   `VITE_API_URL`: Path to the local API service (default: `http://localhost:8088`).
*   `VITE_BETTER_AUTH_URL`: Path matching the Better Auth router (default: `http://localhost:8088`).
*   Plan Price IDs (`VITE_STRIPE_STARTER_PRICE_ID`, etc.) reflecting the corresponding Stripe configuration.

---

## 🚀 Getting Started (Local Development)

### 1. Install Dependencies
Run the install script from the repository root:
```bash
bun install
```

### 2. Startup Application Services
Run the following commands in separate terminal sessions or use a process runner:

#### Start API Server & Job Workers
```bash
bun run --filter @workspace/api dev
```
*   This initiates the Express backend on port `8088`, connects to MongoDB, boots the BullMQ workers, and initiates the initial exchange rate sync.

#### Start Vite Web App
```bash
bun run --filter @workspace/web dev
```
*   This starts the React frontend server on port `3000`.

#### Start Blog (Next.js)
```bash
bun run --filter @workspace/blog dev
```
*   Blog dev server runs on port `3001` to avoid collision with web.

#### Start BullMQ Board
```bash
bun run --filter @workspace/bullmq dev
```
*   Queue monitoring dashboard on port `3030`.

#### Remote Development via Nginx Proxy

If developing on a remote server, use the included `dev.nginx.conf` to expose all dev servers through a single port (443) over HTTPS:

```bash
# One-time setup
sudo cp dev.nginx.conf /etc/nginx/sites-available/ckdev
sudo ln -sf /etc/nginx/sites-available/ckdev /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Start all services
bun run --filter @workspace/api dev &
bun run --filter @workspace/web dev &
bun run --filter @workspace/blog dev &
bun run --filter @workspace/bullmq dev &
```

Then access from any device at `https://ckdev.commissionkit.co` (or `https://<server-ip>`).

> HTTPS requires a valid SSL certificate. The checked-in config uses self-signed certificate paths (`/etc/nginx/ssl/ckdev/`) for the dev preview. Replace these with trusted certificates (e.g. Let's Encrypt) before reloading nginx for trusted access.

---

## 📈 Multi-Tier Subscription & Trial Model

CommissionKit operates a premium, multi-tier pricing architecture with the following specifications:

*   **Tiers**:
    *   **Starter ($49/mo)**: Ideal for small teams (up to 10 sales reps).
    *   **Growth ($99/mo)**: Designed for stable, expanding teams (up to 30 sales reps).
    *   **Pro ($249/mo)**: Best for serious sales organizations (up to 100 sales reps).
*   **Annual Savings**: Users can toggle to annual billing to save **17% (2 months free)**:
    *   Starter: `$490/year`
    *   Growth: `$990/year`
    *   Pro: `$2490/year`
*   **Extra Reps**: Organizations can dynamically purchase extra reps at **$8/rep/month** (or **$80/rep/year**) based on their billing interval.
*   **14-Day Trial**: All new workspaces are eligible for a **strictly one-time 14-day free trial** upon checkout. The database schema uses a permanent `trialUsed` audit flag per workspace to prevent trial abuse.

---

## 🔨 Code Generation & Maintenance

### Codegen Client & Hooks
If you modify the OpenAPI spec in `lib/api-spec`, you can regenerate all TypeScript types, Zod schemas, and React Query hooks using:
```bash
bun run --filter @workspace/api-spec codegen
```

### Build & Typecheck
Ensure the entire repository builds successfully:
```bash
bun run build
```

Verify type safety across all libraries and application workspaces:
```bash
bun run typecheck
```

---

## 📄 License
This project is licensed under the MIT License.
