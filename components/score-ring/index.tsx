"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

const RADIUS = 28;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const SWEEP_MS = 900;

/**
 * Drives the sweep + count-up from one value so the ring and the number can
 * never disagree. Animates from the previously shown score (0 on first
 * mount), and snaps instantly when disabled or when the user prefers
 * reduced motion.
 */
function useAnimatedScore(target: number | null, enabled: boolean): number | null {
  const [value, setValue] = useState(enabled ? 0 : (target ?? 0));
  const shown = useRef(enabled ? 0 : (target ?? 0));

  useEffect(() => {
    if (target === null) return;
    if (
      !enabled ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      shown.current = target;
      setValue(target);
      return;
    }

    const from = shown.current;
    const delta = target - from;
    if (delta === 0) return;

    const start = performance.now();
    const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
    let frame = requestAnimationFrame(function tick(now: number) {
      const t = Math.min(1, (now - start) / SWEEP_MS);
      const current = from + delta * easeOutCubic(t);
      setValue(current);
      shown.current = current;
      if (t < 1) frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [target, enabled]);

  return target === null ? null : value;
}

type ScoreRingProps = {
  /** `null` means the ATS engine hasn't scored this version yet. */
  score: number | null;
  size?: number;
  /**
   * Sweep the ring and count the number up on mount and on score changes.
   * Reserved for reveal moments (analysis, checker results, live re-score);
   * list cards stay static so grids don't shimmer on every page load.
   */
  animated?: boolean;
  className?: string;
};

export function ScoreRing({
  score,
  size = 64,
  animated = false,
  className,
}: ScoreRingProps) {
  const shown = useAnimatedScore(score, animated);
  const scored = score !== null;
  const offset =
    shown !== null ? CIRCUMFERENCE * (1 - shown / 100) : CIRCUMFERENCE;
  // Accent follows the real score, not the mid-animation value, so the color
  // never flickers through thresholds during the sweep.
  const accent = !scored
    ? "text-on-surface-variant"
    : score >= 80
      ? "text-primary"
      : "text-coral-hi";

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center",
        scored && "drop-shadow-[0_0_6px_rgba(91,192,107,0.4)]",
        className,
      )}
      style={{ width: size, height: size }}
      title={scored ? `ATS score ${score}` : "Not scored yet"}
    >
      <svg viewBox="0 0 64 64" className="size-full -rotate-90">
        <circle
          cx="32"
          cy="32"
          r={RADIUS}
          fill="transparent"
          stroke="currentColor"
          strokeWidth="4"
          className="text-[var(--border-strong)]"
        />
        {scored ? (
          <circle
            cx="32"
            cy="32"
            r={RADIUS}
            fill="transparent"
            stroke="currentColor"
            strokeWidth="4"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={accent}
          />
        ) : null}
      </svg>
      <span className={cn("absolute font-mono text-sm", accent)}>
        {shown !== null ? Math.round(shown) : "n/a"}
      </span>
    </div>
  );
}
