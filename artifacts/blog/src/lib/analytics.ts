/**
 * Umami Analytics — privacy-first product analytics for the blog.
 *
 * The Umami script is loaded in [lang]/layout.tsx via a <script defer> tag.
 * Page views are auto-tracked (this is an MPA, not an SPA).
 * We send custom events for CTA views, clicks, and email subscribes.
 */

declare global {
  interface Window {
    umami?: {
      track: (
        event: string | object | ((props: any) => object),
        data?: Record<string, string | number | boolean | null>,
      ) => void;
    };
  }
}

function safe(): boolean {
  return typeof window !== "undefined" && !!window.umami;
}

/** Fire a custom Umami event with optional properties. */
export function trackEvent(
  name: string,
  data?: Record<string, string | number | boolean | null>,
) {
  if (!safe()) return;
  try {
    window.umami!.track(name, data ?? {});
  } catch {
    // silently fail — analytics should never break the page
  }
}

// ─── Blog Funnel Events ─────────────────────────────────────────────────────

export interface CtaViewPayload {
  funnel: string;
  stage: string;
  slug: string;
}

export interface CtaClickPayload {
  funnel: string;
  stage: string;
  action: string;
  slug: string;
}

/**
 * Track when a funnel CTA is rendered (impression).
 * Event name: `{funnel}_{stage}_cta_view` — e.g. `odoo_tofu_cta_view`
 * Use this name directly in Umami funnel step Event filters.
 */
export function trackCtaView(payload: CtaViewPayload) {
  const eventName = `${payload.funnel}_${payload.stage}_cta_view`;
  trackEvent(eventName, {
    slug: payload.slug,
  });
}

/**
 * Track when a user clicks a funnel CTA.
 * Event name: `{funnel}_{stage}_cta_click` — e.g. `odoo_mofu1_cta_click`
 * Use this name directly in Umami funnel step Event filters.
 */
export function trackCtaClick(payload: CtaClickPayload) {
  const eventName = `${payload.funnel}_${payload.stage}_cta_click`;
  trackEvent(eventName, {
    action: payload.action,
    slug: payload.slug,
  });
}

/** Track when a user successfully subscribes via the email form. */
export function trackSubscribe(slug: string) {
  trackEvent("blog_subscribe", { slug });
}
