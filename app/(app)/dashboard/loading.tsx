import { Skeleton } from "@/components/ui/skeleton";

/** Mirrors the dashboard layout: hero, three stat tiles, recent resume rows. */
export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-10 p-4 md:p-8">
      <section className="rounded-xl border border-border bg-surface-container p-6 md:p-10">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="space-y-3">
            <Skeleton className="h-10 w-72 bg-surface-container-high md:h-14 md:w-96" />
            <Skeleton className="h-4 w-64 bg-surface-container-high" />
          </div>
          <Skeleton className="h-14 w-56 rounded-xl bg-surface-container-high" />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-6"
          >
            <div className="flex items-start justify-between">
              <Skeleton className="h-3 w-24 bg-surface-container-high" />
              <Skeleton className="size-5 rounded bg-surface-container-high" />
            </div>
            <Skeleton className="h-8 w-16 bg-surface-container-high" />
          </div>
        ))}
      </section>

      <section className="space-y-6">
        <Skeleton className="h-8 w-48 bg-surface-container-high" />
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-6 rounded-xl border border-border bg-surface p-6"
            >
              <div className="flex items-center gap-4">
                <Skeleton className="size-12 rounded-lg bg-surface-container-high" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-48 bg-surface-container-high" />
                  <Skeleton className="h-3 w-28 bg-surface-container-high" />
                </div>
              </div>
              <Skeleton className="size-5 rounded bg-surface-container-high" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
