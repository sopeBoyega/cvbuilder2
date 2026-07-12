"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * After returning from Paystack, Pro is granted asynchronously by the webhook.
 * This refreshes the server component a few times so the page flips to "You're
 * on Pro" on its own, without the user reloading. It renders only while still
 * on the free plan (the parent unmounts it once Pro lands), and gives up after
 * a bounded number of tries so it can't poll forever.
 */
const MAX_TRIES = 12;
const INTERVAL_MS = 2500;

export function ActivationPoller() {
  const router = useRouter();
  const [tries, setTries] = useState(0);

  useEffect(() => {
    if (tries >= MAX_TRIES) return;
    const timer = setTimeout(() => {
      router.refresh();
      setTries((n) => n + 1);
    }, INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [tries, router]);

  return null;
}
