import { cn } from "@/lib/utils";

const RADIUS = 28;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

type ScoreRingProps = {
  score: number;
  size?: number;
  className?: string;
};

export function ScoreRing({ score, size = 64, className }: ScoreRingProps) {
  const offset = CIRCUMFERENCE * (1 - score / 100);
  const accent = score >= 80 ? "text-primary" : "text-indigo-hi";

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center drop-shadow-[0_0_6px_rgba(91,192,107,0.4)]",
        className,
      )}
      style={{ width: size, height: size }}
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
        <circle
          cx="32"
          cy="32"
          r={RADIUS}
          fill="transparent"
          stroke="currentColor"
          strokeWidth="4"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          className={accent}
        />
      </svg>
      <span className={cn("absolute font-mono text-sm", accent)}>{score}</span>
    </div>
  );
}
