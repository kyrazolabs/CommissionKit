# CommissionKit: Platform Documentation

CommissionKit is a high-performance Sales Commission Platform designed for SaaS and sales-driven organizations. It automates the complex process of tracking deals, calculating rep earnings, and providing transparent reporting through a centralized dashboard and public representative portals.

---

## 1. Core Objectives
- **Transparency**: Provide sales reps with real-time visibility into their earnings.
- **Automation**: Replace error-prone spreadsheets with automated commission calculation runs.
- **Scalability**: Handle thousands of deals asynchronously using background workers.
- **Multi-tenancy**: Support multiple independent workspaces with team collaboration.

---

## 2. Technical Architecture
CommissionKit is built as a **TypeScript Monorepo** using **Bun** for maximum performance and unified developer experience.

### Monorepo Structure:
- **`artifacts/web`**: React SPA built with Vite and Tailwind CSS.
- **`artifacts/api`**: Express backend serving as the API and orchestrator.
- **`lib/db`**: Shared database layer using Mongoose (MongoDB).
- **`lib/queue`**: Shared BullMQ (Redis) logic for background workers.
- **`lib/email-templates`**: Reusable email templates for system notifications.
- **`lib/api-spec`**: OpenAPI specification defining the contract between frontend and backend.

### Technology Stack:
- **Runtime**: Bun
- **Frontend**: React, Tailwind CSS, Shadcn UI, Vite
- **Backend**: Express.js
- **Database**: MongoDB (Mongoose)
- **Authentication**: Better Auth (with Organization & Multi-tenancy support)
- **Task Queue**: BullMQ + Redis
- **Email**: SMTP with dynamic templates
- **Billing**: Stripe Integration

---

## 3. Key Modules & Features

### A. Sales Representative Management
Manage the sales force with granular control.
- **Rep Profile**: Name, Email, and specific Commission Rate.
- **Public Portal**: Each rep receives a secure, unique link (with a rotating access code) to view their own commission dashboard without needing a platform login.

### B. Deal Ingestion
The system records sales data (Deals) which serve as the raw input for commissions.
- **Fields**: Amount, Close Date, Status (Pending/Approved), and Rep Assignment.
- **Integration**: Designed to accept deals via API or manual entry.

### C. Commission Calculation (Runs)
The core engine of the platform.
- **Asynchronous Processing**: Calculations are handled by the `calc-worker` in the background to prevent UI lag.
- **Runs**: Admin can trigger a "Commission Run" for specific periods. The system iterates through all approved deals and applies the Rep's specific rates to generate accurate earnings reports.

### D. Multi-tenant Workspaces
- **Organization Support**: Users can create or join multiple workspaces.
- **RBAC**: Role-based access control (Admin/Member) managed via Better Auth.
- **Invitations**: Secure email invitation system for onboarding team members.

---

## 4. Database Schema Overview
The system uses MongoDB for flexibility and performance:
- **Workspaces**: Stores organization metadata and subscription status.
- **Reps**: Profiles for sales personnel, including their `portalAccessCode`.
- **Deals**: Individual sale records linked to a Rep and Workspace.
- **CommissionRuns**: Logs of calculation batches and their results.
- **Plans**: Configuration for different commission structures/tiers.
- **Subscriptions**: Stripe-linked billing data.

---

## 5. Deployment & Infrastructure
The platform is optimized for modern containerized environments:
- **Docker Compose**: Orchestrates the Web (Nginx), API (Bun), and Redis services.
- **Nginx Reverse Proxy**: Acts as the top-level entry point, routing traffic to the static frontend and `/api` requests to the backend.
- **Coolify Integration**: Ready for seamless CI/CD via GitHub and Coolify.
- **Internal Networking**: Uses a private Docker network for secure communication between the API and the internal Redis database.

---

## 6. Authentication & Security
- **Better Auth**: Handles session management, password hashing, and CSRF protection.
- **Secure Cookies**: Production-grade cookie security enabled by default.
- **Email Normalization**: Standardizes emails (lowercasing and trimming) to prevent duplicate accounts.
- **Access Codes**: Uses 12-character high-entropy codes for the Public Rep Portal.

---
*Created by the CommissionKit Engineering Team.*
