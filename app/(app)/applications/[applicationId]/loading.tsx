import { Skeleton } from "@/components/ui/skeleton";

/** Mirrors the detail layout: header card, two analysis cards, notes, sidebar. */
export default function ApplicationDetailLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-4 w-44 bg-surface-container-high" />
        <Skeleton className="h-10 w-44 rounded-lg bg-surface-container-high" />
      </div>

      <div className="rounded-xl border border-border bg-surface p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row">
          <div className="space-y-3">
            <Skeleton className="h-9 w-72 bg-surface-container-high" />
            <Skeleton className="h-4 w-40 bg-surface-container-high" />
          </div>
          <Skeleton className="h-4 w-36 bg-surface-container-high" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="space-y-4 rounded-xl border border-border bg-surface p-6"
              >
                <Skeleton className="h-6 w-40 bg-surface-container-high" />
                <div className="flex flex-wrap gap-2">
                  {[0, 1, 2, 3, 4].map((chip) => (
                    <Skeleton
                      key={chip}
                      className="h-6 w-16 rounded bg-surface-container-high"
                    />
                  ))}
                </div>
                <Skeleton className="h-3 w-full bg-surface-container-high" />
                <Skeleton className="h-3 w-3/4 bg-surface-container-high" />
              </div>
            ))}
          </div>
          <div className="space-y-4 rounded-xl border border-border bg-surface p-6">
            <Skeleton className="h-6 w-44 bg-surface-container-high" />
            <Skeleton className="h-32 w-full rounded-lg bg-surface-container-high" />
          </div>
        </div>

        <div className="space-y-6">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="space-y-3 rounded-xl border border-border bg-surface p-6"
            >
              <Skeleton className="h-6 w-40 bg-surface-container-high" />
              <Skeleton className="h-14 w-full rounded-lg bg-surface-container-high" />
              <Skeleton className="h-14 w-full rounded-lg bg-surface-container-high" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
