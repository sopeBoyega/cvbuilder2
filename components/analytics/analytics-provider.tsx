"use client";

import { useEffect } from "react";

import { initAnalytics } from "@/lib/analytics";

/** Boots PostHog on the client. Renders nothing; safe with no key set. */
export function AnalyticsProvider() {
  useEffect(() => {
    initAnalytics();
  }, []);

  return null;
}
