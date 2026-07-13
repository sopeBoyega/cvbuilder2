import posthog from "posthog-js";

/**
 * Funnel analytics (PostHog). Everything no-ops when
 * `NEXT_PUBLIC_POSTHOG_KEY` is unset, so local dev and CI never send events.
 *
 * Event names are a closed union — add here, not inline at call sites, so the
 * funnel dashboard doesn't accumulate misspelled variants.
 */

export type AnalyticsEvent =
  /** A guest ran the free ATS checker and got a score. */
  | "checker_used"
  /** A guest left their email (e.g. on checker results). */
  | "email_captured"
  /** A marketing CTA was clicked; `cta` names which, `location` names where. */
  | "cta_clicked";

// NEXT_PUBLIC_ vars must be referenced literally for Next to inline them
// client-side (lib/env.ts is server-only — importing it here would crash).
const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

let initialized = false;

/** Idempotent; called by AnalyticsProvider once on mount. */
export function initAnalytics(): void {
  if (initialized || !KEY || typeof window === "undefined") return;
  initialized = true;
  posthog.init(KEY, {
    api_host: HOST,
    // SPA-aware pageviews on App Router navigations.
    capture_pageview: "history_change",
    capture_pageleave: true,
    persistence: "localStorage+cookie",
  });
}

export function track(
  event: AnalyticsEvent,
  properties?: Record<string, string | number | boolean | null>,
): void {
  if (!initialized) return;
  posthog.capture(event, properties);
}
