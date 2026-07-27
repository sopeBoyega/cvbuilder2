import { cn } from "@/lib/utils";

/**
 * The CVBuilder mark: the circular "cv" avatar. A raster/vector asset (not
 * `currentColor`) — it carries its own background and colors, so it renders
 * the same on any surface rather than inheriting text color.
 */
export function Logo({
  className,
  title,
}: {
  className?: string;
  title?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- decorative mark, sized via className like the old inline SVG
    <img
      src="/cv-avatar.svg"
      alt={title ?? ""}
      aria-hidden={title ? undefined : "true"}
      className={cn("inline-block shrink-0", className)}
    />
  );
}
