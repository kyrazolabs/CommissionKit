/**
 * Umami Analytics — privacy-first product analytics.
 *
 * Auto-track is disabled (data-auto-track="false") because this is an SPA.
 * We manually push SPA page views via the object/callback form and
 * custom events for every meaningful user interaction.
 */

declare global {
  interface Window {
    umami?: {
      track: (event: string | object | ((props: any) => object), data?: Record<string, string | number | boolean | null>) => void;
    };
  }
}

function safe(): boolean {
  return typeof window !== "undefined" && !!window.umami;
}

// ─── SPA Page views ──────────────────────────────────────────────────────────

/**
 * Register an SPA page view with Umami.
 * Must be called with { url } object (not an event-name string) so Umami
 * treats it as a real page navigation and associates subsequent events
 * with this URL.
 */
export function trackPageView(url: string, referrer?: string) {
  if (!safe()) return;
  window.umami!.track({ url, referrer: referrer ?? (document.referrer || undefined) });
}

// ─── Custom events — every meaningful user action ────────────────────────────

export const Analytics = {
  // ── Auth ──────────────────────────────────────────────────────────────
  authLoginView() { track("auth_login_view"); },
  authSignupView() { track("auth_signup_view"); },
  authForgotView() { track("auth_forgot_view"); },
  authSignupAttempt() { track("auth_signup_attempt"); },
  authLoginAttempt(provider: "email" | "google") { track("auth_login_attempt", { provider }); },
  authLoginSuccess(provider: "email" | "google") { track("auth_login_success", { provider }); },
  authLoginFailed(provider: "email" | "google", reason: string) { track("auth_login_failed", { provider, reason }); },
  authSignupSuccess() { track("auth_signup_success"); },
  authForgotRequest() { track("auth_forgot_request"); },
  authResendVerification() { track("auth_resend_verification"); },
  authModeSwitch(from: string, to: string) { track("auth_mode_switch", { from, to }); },
  authSignOut() { track("auth_sign_out"); },

  // ── Workspace ─────────────────────────────────────────────────────────
  workspaceCreateView() { track("workspace_create_view"); },
  workspaceCreated(engine: string | undefined) { track("workspace_created", { engine: engine ?? "standard" }); },
  workspaceSwitched(engine: string | undefined) { track("workspace_switched", { engine: engine ?? "standard" }); },
  workspaceCreateFailed() { track("workspace_create_failed"); },

  // ── Navigation ────────────────────────────────────────────────────────
  navClick(group: string, href: string, label: string) { track("nav_click", { group, href, label }); },
  dashboardView() { track("dashboard_view"); },

  // ── Reps ──────────────────────────────────────────────────────────────
  repsView() { track("reps_view"); },
  repCreated() { track("rep_created"); },
  repBulkImport(count: number) { track("rep_bulk_import", { count }); },
  repPortalCodeGenerated() { track("rep_portal_code_generated"); },

  // ── Plans ─────────────────────────────────────────────────────────────
  plansView() { track("plans_view"); },
  planCreated(hasTiers: boolean, hasAccelerator: boolean) { track("plan_created", { hasTiers, hasAccelerator }); },
  planDeleted() { track("plan_deleted"); },

  // ── Deals ─────────────────────────────────────────────────────────────
  dealsView() { track("deals_view"); },
  dealCreated() { track("deal_created"); },
  dealBulkImport(count: number) { track("deal_bulk_import", { count }); },
  dealExport() { track("deal_export"); },

  // ── Commission Runs ───────────────────────────────────────────────────
  runsView() { track("runs_view"); },
  runDetailView() { track("run_detail_view"); },
  runCalculated(engine: string | undefined) { track("run_calculated", { engine: engine ?? "standard" }); },
  runExport() { track("run_export"); },

  // ── Payouts ───────────────────────────────────────────────────────────
  payoutsView() { track("payouts_view"); },
  payoutCreated(method: string) { track("payout_created", { method }); },
  payoutStatusChanged(from: string, to: string) { track("payout_status_changed", { from, to }); },

  // ── Disputes ──────────────────────────────────────────────────────────
  disputesView() { track("disputes_view"); },
  disputeFiled() { track("dispute_filed"); },
  disputeResolved(verdict: string) { track("dispute_resolved", { verdict }); },

  // ── Reports ───────────────────────────────────────────────────────────
  reportsView() { track("reports_view"); },
  reportExported(format: "csv" | "pdf") { track("report_exported", { format }); },

  // ── Team ──────────────────────────────────────────────────────────────
  teamView() { track("team_view"); },
  teamMemberInvited(role: string) { track("team_member_invited", { role }); },
  teamMemberRoleChanged(from: string, to: string) { track("team_member_role_changed", { from, to }); },
  teamMemberRemoved() { track("team_member_removed"); },
  teamInviteAccepted() { track("team_invite_accepted"); },

  // ── Settings ──────────────────────────────────────────────────────────
  settingsView() { track("settings_view"); },
  settingsSaved() { track("settings_saved"); },

  // ── Billing ───────────────────────────────────────────────────────────
  billingView() { track("billing_view"); },
  billingPlanSelected(plan: string, yearly: boolean) { track("billing_plan_selected", { plan, yearly }); },
  billingCheckoutStarted(plan: string, yearly: boolean, extraReps: number) { track("billing_checkout_started", { plan, yearly, extraReps }); },
  billingCheckoutRedirected(plan: string) { track("billing_checkout_redirected", { plan }); },
  billingCheckoutError(plan: string, error: string) { track("billing_checkout_error", { plan, error }); },
  billingPortalOpened() { track("billing_portal_opened"); },
  billingExtraRepsSaved(count: number) { track("billing_extra_reps_saved", { count }); },
  billingCurrencyToggled(currency: string) { track("billing_currency_toggled", { currency }); },
  billingYearlyToggled(yearly: boolean) { track("billing_yearly_toggled", { yearly }); },

  // ── Integrations ──────────────────────────────────────────────────────
  integrationsView() { track("integrations_view"); },
  integrationConnectOpened(provider: string) { track("integration_connect_opened", { provider }); },
  integrationConnected(provider: string) { track("integration_connected", { provider }); },
  integrationDisconnected(provider: string) { track("integration_disconnected", { provider }); },

  // ── Enterprise / Aissol ───────────────────────────────────────────────
  enterpriseProjectsView() { track("enterprise_projects_view"); },
  enterpriseProjectDetailView() { track("enterprise_project_detail_view"); },
  enterpriseMatrixView() { track("enterprise_matrix_view"); },
  enterpriseReportsView() { track("enterprise_reports_view"); },
  enterpriseRunsView() { track("enterprise_runs_view"); },

  // ── Portal ────────────────────────────────────────────────────────────
  portalLogin() { track("portal_login"); },
  portalView(engine: string | undefined) { track("portal_view", { engine: engine ?? "standard" }); },
  portalPayoutViewed() { track("portal_payout_viewed"); },

  // ── Public / Landing ──────────────────────────────────────────────────
  landingView() { track("landing_view"); },
  landingCTAClick(location: string) { track("landing_cta_click", { location }); },
  landingSectionView(section: string) { track("landing_section_view", { section }); },
  landingPricingCTAClick(plan: string) { track("landing_pricing_cta_click", { plan }); },
  calculatorUsed() { track("calculator_used"); },
  calculatorResultView() { track("calculator_result_view"); },
  legalPageView(page: "privacy" | "terms" | "security") { track("legal_page_view", { page }); },

  // ── UI / Dialogs ──────────────────────────────────────────────────────
  dialogOpened(dialog: string) { track("dialog_opened", { dialog }); },
  dialogClosed(dialog: string) { track("dialog_closed", { dialog }); },
  dialogConfirmed(dialog: string) { track("dialog_confirmed", { dialog }); },
  toastShown(type: string, message: string) { track("toast_shown", { type, message }); },

  // ── Theme / Preferences ───────────────────────────────────────────────
  themeToggled(theme: "light" | "dark") { track("theme_toggled", { theme }); },
  languageChanged(lang: string) { track("language_changed", { lang }); },

  // ── Session / Lifecycle ───────────────────────────────────────────────
  errorOccurred(source: string, message: string) { track("error_occurred", { source, message }); },
  limitReached(feature: string, currentPlan: string) { track("limit_reached", { feature, currentPlan }); },
} as const;

// ─── Internal helper ─────────────────────────────────────────────────────────

function track(event: string, data?: Record<string, string | number | boolean | null>) {
  if (!safe()) return;
  try {
    window.umami!.track(event, data);
  } catch {
    // Silently ignore analytics errors — never break the app
  }
}
