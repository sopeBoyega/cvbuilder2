"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Fade-up-on-scroll wrapper for below-the-fold sections.
 *
 * Fail-safe by construction: content renders visible, and is only hidden
 * *after* mount, and only when it's genuinely below the viewport — so there's
 * no flash on above-fold content, nothing stays invisible without JS, and
 * `prefers-reduced-motion` opts out entirely. Animates once; no re-trigger on
 * scroll-up (repeat reveals read as a gimmick by the third section).
 */
export function Reveal({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"static" | "hidden" | "shown">("static");

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Already (partly) on screen at mount — leave it alone.
    if (element.getBoundingClientRect().top < window.innerHeight) return;

    setState("hidden");
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState("shown");
          observer.disconnect();
        }
      },
      // Fire once ~15% of the viewport height before the element arrives.
      { rootMargin: "0px 0px -15% 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "transition-[opacity,translate] duration-700 ease-out",
        state === "hidden" && "translate-y-6 opacity-0",
        state === "shown" && "translate-y-0 opacity-100",
        className,
      )}
    >
      {children}
    </div>
  );
}
