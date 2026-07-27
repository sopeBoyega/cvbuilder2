import { Skeleton } from "@/components/ui/skeleton";

/** Content-only: the settings layout (header + tab rail) persists around it. */
export default function BillingLoading() {
  return (
    <div className="max-w-2xl space-y-6">
      <Skeleton className="h-4 w-full max-w-md bg-surface-container-high" />

      <div className="space-y-6 rounded-xl border border-border bg-surface p-6">
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-lg bg-surface-container-high" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-28 bg-surface-container-high" />
            <Skeleton className="h-3 w-40 bg-surface-container-high" />
          </div>
        </div>
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="size-4 rounded-full bg-surface-container-high" />
              <Skeleton className="h-3 w-56 bg-surface-container-high" />
            </div>
          ))}
        </div>
        <Skeleton className="h-12 w-full rounded-lg bg-surface-container-high" />
      </div>
    </div>
  );
}
