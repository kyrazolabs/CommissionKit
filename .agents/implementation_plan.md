# Implementation Plan - Better Auth Integration

This plan outlines the steps to integrate [Better Auth](https://better-auth.com) into the CommissionKit project using the existing MongoDB database and Express framework.

## User Review Required

> [!IMPORTANT]
> - I will be using the `mongodbAdapter` from `better-auth/adapters/mongodb`.
> - The API route handler will be added to the Express application in `artifacts/api/src/index.ts`.
> - I will generate a 32-character secret for `BETTER_AUTH_SECRET`.

## Proposed Changes

### [Component] API Service (`artifacts/api`)

#### [MODIFY] [package.json](file:///home/nxion/The%20Forge/Projects/SaaS/CommissionKit/artifacts/api/package.json)
- Add `better-auth` dependency.

#### [NEW] [auth.ts](file:///home/nxion/The%20Forge/Projects/SaaS/CommissionKit/artifacts/api/src/lib/auth.ts)
- Configure `betterAuth()` with the MongoDB adapter.
- Enable `emailAndPassword`.
- Export the `auth` instance.

#### [NEW] [auth-client.ts](file:///home/nxion/The%20Forge/Projects/SaaS/CommissionKit/artifacts/api/src/lib/auth-client.ts)
- Create the Better Auth client using `better-auth/client`.

#### [MODIFY] [index.ts](file:///home/nxion/The%20Forge/Projects/SaaS/CommissionKit/artifacts/api/src/index.ts)
- Add the Better Auth route handler: `app.all("/api/auth/*", toNodeHandler(auth))`.

### [Component] Environment & Config

#### [MODIFY] [.env](file:///home/nxion/The%20Forge/Projects/SaaS/CommissionKit/artifacts/api/.env)
- Add `BETTER_AUTH_SECRET`.
- Add `BETTER_AUTH_URL` (defaulting to `http://localhost:8088`).

#### [NEW] [.env.example](file:///home/nxion/The%20Forge/Projects/SaaS/CommissionKit/artifacts/api/.env.example)
- Add placeholder for `BETTER_AUTH_SECRET`.

## Verification Plan

### Automated Tests
- Run `npx @better-auth/cli migrate` to ensure database schema is ready.
- Verify the `/api/auth/ok` (or similar) endpoint responds correctly.

### Manual Verification
- Test the signup/signin flow via API requests.
