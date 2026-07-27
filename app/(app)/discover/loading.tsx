import { Skeleton } from "@/components/ui/skeleton";

/** Mirrors the feed layout: header, then ranked listing cards. */
export default function DiscoverLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
      <div className="space-y-3">
        <Skeleton className="h-9 w-40 bg-surface-container-high" />
        <Skeleton className="h-4 w-96 bg-surface-container-high" />
      </div>

      <div className="space-y-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="space-y-4 rounded-xl border border-border bg-surface p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <Skeleton className="h-5 w-64 bg-surface-container-high" />
                <Skeleton className="h-3 w-48 bg-surface-container-high" />
              </div>
              <Skeleton className="h-8 w-10 bg-surface-container-high" />
            </div>
            <Skeleton className="h-3 w-full bg-surface-container-high" />
            <Skeleton className="h-3 w-3/4 bg-surface-container-high" />
            <Skeleton className="h-9 w-44 rounded-lg bg-surface-container-high" />
          </div>
        ))}
      </div>
    </div>
  );
}
