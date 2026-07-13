import { Skeleton } from "@/components/ui/skeleton";

/** Mirrors the insights layout: header, stat tiles, funnel + variant scores. */
export default function InsightsLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">
      <div className="space-y-3">
        <Skeleton className="h-9 w-40 bg-surface-container-high" />
        <Skeleton className="h-4 w-96 bg-surface-container-high" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="space-y-3 rounded-xl border border-border bg-surface p-6"
          >
            <div className="flex items-start justify-between">
              <Skeleton className="h-3 w-24 bg-surface-container-high" />
              <Skeleton className="size-5 rounded bg-surface-container-high" />
            </div>
            <Skeleton className="h-8 w-16 bg-surface-container-high" />
            <Skeleton className="h-3 w-32 bg-surface-container-high" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-5 rounded-xl border border-border bg-surface p-6">
          <Skeleton className="h-6 w-48 bg-surface-container-high" />
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="grid grid-cols-[90px_1fr] items-center gap-4">
              <Skeleton className="h-8 w-full bg-surface-container-high" />
              <Skeleton className="h-8 w-full rounded-lg bg-surface-container-high" />
            </div>
          ))}
        </div>
        <div className="space-y-4 rounded-xl border border-border bg-surface p-6">
          <Skeleton className="h-6 w-44 bg-surface-container-high" />
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-3/4 bg-surface-container-high" />
              <Skeleton className="h-1.5 w-full rounded-full bg-surface-container-high" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
