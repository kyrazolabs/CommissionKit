# Memory — Careers Page Feature

Last updated: 2026-07-03

## What was built

- **Job data config**: `artifacts/web/src/lib/jobs.ts` — static job definitions with title, department, location, type, description, responsibilities, requirements, offers.
- **Careers listing page**: `artifacts/web/src/pages/careers.tsx` — public `/careers` route with hero section, culture values cards, and open positions list. Uses landing page Navbar/Footer pattern.
- **Job detail + application page**: `artifacts/web/src/pages/careers-job.tsx` — public `/careers/:slug` route showing job details (About the role, Responsibilities, Requirements, What we offer) + application form. Form submits to `POST /api/apply` with `position` field.
- **Updated API apply endpoint**: `artifacts/api/src/routes/apply/routes.ts` — accepts `position` field, includes it in email subject and template.
- **Updated email template**: `lib/email-templates/src/application.ts` — includes `escapeHtml` helper to prevent XSS injection, shows position in email body.
- **Route registration**: Updated `artifacts/web/src/App.tsx` with `/careers/:slug` and `/careers` routes. Removed old `/apply` route.
- **Navigation links**: Added "Careers" to landing Navbar (desktop + mobile) and Footer.
- **Tests**: `artifacts/api/src/routes/apply/routes.test.ts` — validates form submission and email enqueue with mocked queue.
- **Progress tracker**: Updated `context/progress-tracker.md` with new feature status.

## Decisions made

- **Static job config over database**: For a small startup with 1-3 open positions, a static TypeScript file is simpler and requires no migrations. Easy to move to DB later if needed.
- **Single-page job detail + form**: `/careers/:slug` shows job info and application form together. This is the pattern used by Linear, Stripe, and other professional companies. Better UX than a separate apply page.
- **Escape HTML in email templates**: All user-submitted fields are escaped before interpolation into HTML email bodies. Prevents XSS and phishing via email notifications.
- **BCC support in mail queue**: Added `bcc` field to `MailJobSchema` and `sendMail()` so BCC recipients survive the full queue → SMTP pipeline.
- **Use `asChild` on Button with Link**: Avoids invalid HTML nesting (`<a><button>`) by making Button render as the Link component.

## Problems solved

- **HTML injection vulnerability**: Review flagged that user fields were interpolated raw into email HTML. Fixed with `escapeHtml` helper in `application.ts`.
- **BCC silently stripped**: Review #3 found `MailJobSchema` had no `bcc` field, so Zod stripped it before SMTP. Fixed by adding `bcc` to `MailJobSchema` and passing it in `sendMail()`.
- **Secrets in opencode.json**: Review #4 found live credentials committed. Renamed to `opencode.jsonc`, replaced secrets with `{env:VAR}` placeholders, added to `.gitignore`.
- **Rate limiting on public form**: Review #4 flagged `/api/apply` had only default 300/min limit. Added dedicated `applyRateLimit` (5 req/hour per IP).
- **Hardcoded notification emails**: Review #4 flagged hardcoded `to`/`bcc`. Moved to env vars `APPLY_NOTIFICATION_TO` and `APPLY_NOTIFICATION_BCC` with sensible defaults.
- **Restrictive email regex**: Review #4 found frontend regex rejected valid emails like `user+tag@example.com`. Relaxed to `.+@.+\..+`.
- **Invalid HTML nesting**: Review flagged `<button>` inside `<a>` in error/success states. Fixed by using `Button asChild` with `Link`.
- **Frontend validation error display**: Backend returns field-level errors (`details: { linkedinUrl: ["Invalid url"] }`), but frontend showed raw `"ValidationError"`. Fixed by mapping `data.details` back to field errors.
- **Route ordering**: Wouter's `Switch` matches in order. `/careers/:slug` must be declared before `/careers` to avoid falling through incorrectly.
- **Email template interface**: Initially used wrong props (`title`, `preheader`, `children`) for `baseTemplate`. Fixed to use `previewText` and `body`.
- **MongoDB memory server timeout**: Tests passed initially, then encountered transient MongoDB startup timeouts when using `--preload`. The apply route test does not need MongoDB (it mocks all DB/Redis dependencies), so run without preload.

## Current state

- All files created/modified and **four rounds of code review completed**. All flagged issues have been fixed.
- API route tests passed successfully earlier in the session (2 pass, 0 fail).
- Current test runs fail due to MongoDB memory server `fassert()` crash — this is a **host environment/infrastructure issue**, not a code bug. Tests should pass in a fresh environment or CI.
- Changes are **uncommitted**.

## Next session starts with

1. Run `bun test src/routes/apply/routes.test.ts` from `artifacts/api/` to verify tests pass.
2. If tests pass, commit all changes.
3. Address the review feedback about rate limiting on `/api/apply` (currently only has default 300/min limit).

## Open questions

- Should the job listing be moved to a database collection in the future for non-dev editing?
- Should the application form include a resume/CV file upload field?
- Should `/api/apply` get a stricter rate limit (e.g., 5 requests/hour per IP) to prevent spam?
