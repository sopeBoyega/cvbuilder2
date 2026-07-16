"use client";

import { useEffect } from "react";

import { track, type AnalyticsEvent } from "@/lib/analytics";

/**
 * Fires one analytics event on mount, with referrer + UTM context. Rendered
 * by server pages that want an explicit funnel event beyond the automatic
 * pageview (e.g. the checker page).
 */
export function TrackPageEvent({ event }: { event: AnalyticsEvent }) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let source = "direct";
    try {
      if (document.referrer) source = new URL(document.referrer).hostname;
    } catch {
      // Malformed referrer: keep "direct".
    }
    track(event, {
      source,
      utm_source: params.get("utm_source"),
      utm_campaign: params.get("utm_campaign"),
    });
    // Fire exactly once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
