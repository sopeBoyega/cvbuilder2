import { Skeleton } from "@/components/ui/skeleton";

/** Mirrors the library layout: page header, filter bar, card grid. */
export default function ResumesLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">
      <header className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="space-y-3">
          <Skeleton className="h-9 w-64 bg-surface-container-high" />
          <Skeleton className="h-4 w-80 bg-surface-container-high" />
        </div>
        <Skeleton className="h-11 w-40 rounded-lg bg-surface-container-high" />
      </header>

      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-surface p-3">
        <Skeleton className="h-9 min-w-56 flex-1 rounded-lg bg-surface-container-high" />
        <div className="ml-auto flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <Skeleton
              key={i}
              className="h-9 w-16 rounded-lg bg-surface-container-high"
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="overflow-hidden rounded-xl border border-border bg-surface"
          >
            <Skeleton className="h-28 rounded-none bg-surface-container-high" />
            <div className="space-y-4 p-5">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-44 bg-surface-container-high" />
                  <Skeleton className="h-3 w-28 bg-surface-container-high" />
                </div>
                <Skeleton className="size-12 rounded-full bg-surface-container-high" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16 rounded-full bg-surface-container-high" />
                <Skeleton className="h-6 w-20 rounded-full bg-surface-container-high" />
                <Skeleton className="h-6 w-14 rounded-full bg-surface-container-high" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
