import { cn } from "@/lib/utils";

/**
 * The CVBuilder mark: an open score gauge (the ATS ring) enclosing a rising
 * constellation thread, with the bright terminal dot sitting in the gauge's
 * gap — the score climbing. Both motifs are already the product's hero visuals.
 *
 * Monochrome via `currentColor` so it inherits on any surface. Decorative by
 * default; pass a `title` when it appears without an adjacent wordmark.
 */
export function Logo({
  className,
  title,
}: {
  className?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : "true"}
      aria-label={title}
      className={cn("text-primary", className)}
    >
      {/*
        Score gauge. Circumference = 2*pi*13 ~= 81.7, so "60 22" leaves a ~97deg
        gap running from the top round to the right — which is exactly where the
        bright dot lands.
      */}
      <circle
        cx="16"
        cy="16"
        r="13"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="60 22"
        opacity="0.9"
      />

      {/* Constellation thread, ascending left-to-right. */}
      <path
        d="M10.5 21.5 L16 16.5 L21.5 10.5"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.45"
      />
      <circle cx="10.5" cy="21.5" r="1.6" fill="currentColor" opacity="0.55" />
      <circle cx="16" cy="16.5" r="1.6" fill="currentColor" opacity="0.75" />
      {/* Terminal marker. `motion-safe:` honours prefers-reduced-motion. */}
      <circle
        cx="21.5"
        cy="10.5"
        r="2.4"
        fill="currentColor"
        className="motion-safe:animate-pulse"
      />
    </svg>
  );
}
