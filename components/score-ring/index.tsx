import { cn } from "@/lib/utils";

const RADIUS = 28;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

type ScoreRingProps = {
  /** `null` means the ATS engine hasn't scored this version yet. */
  score: number | null;
  size?: number;
  className?: string;
};

export function ScoreRing({ score, size = 64, className }: ScoreRingProps) {
  const scored = score !== null;
  const offset = scored ? CIRCUMFERENCE * (1 - score / 100) : CIRCUMFERENCE;
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
        {scored ? score : "—"}
      </span>
    </div>
  );
}
