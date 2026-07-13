import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Shared empty-state shell: dashed card, icon tile, heading, supporting copy,
 * and a slot for actions (buttons, links, or option grids). Copy must describe
 * what will really appear here — never invented sample data.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  children,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-dashed border-border bg-surface p-8 text-center md:p-12",
        className,
      )}
    >
      <div className="mx-auto mb-6 flex size-14 items-center justify-center rounded-2xl border border-border bg-surface-raised text-primary">
        <Icon className="size-7" />
      </div>
      <h2 className="font-heading text-2xl font-semibold text-on-background">
        {title}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-on-surface-variant">
        {description}
      </p>
      {children ? <div className="mt-8">{children}</div> : null}
    </div>
  );
}
