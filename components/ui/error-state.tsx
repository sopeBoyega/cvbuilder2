import { AlertCircle, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Focused error card (coral accent): icon tile with a soft glow, what went
 * wrong, and recovery actions. `children` should offer a way forward — a
 * retry button and/or an alternate path — not just acknowledge the failure.
 */
export function ErrorState({
  icon: Icon = AlertCircle,
  title,
  description,
  children,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-md flex-col items-center rounded-xl border border-border bg-surface p-6 text-center md:p-8",
        className,
      )}
    >
      <div className="relative mb-4 flex size-14 items-center justify-center rounded-2xl border border-coral-hi/30 bg-coral-hi/10">
        <div className="absolute inset-0 rounded-2xl bg-coral-hi/10 blur-md" />
        <Icon className="relative size-7 text-coral-hi" />
      </div>
      <h2 className="font-heading text-[22px] font-semibold leading-[1.3] text-on-surface">
        {title}
      </h2>
      <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-on-surface-variant">
        {description}
      </p>
      {children ? (
        <div className="mt-6 flex w-full flex-col gap-2">{children}</div>
      ) : null}
    </div>
  );
}

/** Primary recovery action — coral-outlined, matching the error accent. */
export function ErrorStateAction({
  className,
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-center justify-center gap-2 rounded-lg border border-coral-hi/30 bg-surface-raised px-4 py-3 text-sm font-semibold text-coral-hi transition-colors hover:border-coral-hi/50 hover:bg-coral-hi/10",
        className,
      )}
      {...props}
    />
  );
}
