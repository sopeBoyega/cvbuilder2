import { Skeleton } from "@/components/ui/skeleton";

/** One entry per kanban column (saved → rejected), varied so it reads organic. */
const CARDS_PER_COLUMN = [3, 2, 2, 1, 1];

/** Mirrors the tracker layout: page header, then kanban columns of cards. */
export default function ApplicationsLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div className="space-y-3">
          <Skeleton className="h-9 w-56 bg-surface-container-high" />
          <Skeleton className="h-4 w-96 bg-surface-container-high" />
        </div>
        <Skeleton className="h-11 w-44 rounded-lg bg-surface-container-high" />
      </header>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {CARDS_PER_COLUMN.map((cardCount, column) => (
          <div
            key={column}
            className="w-72 shrink-0 space-y-3 rounded-xl border border-border bg-surface-container-low p-3"
          >
            <Skeleton className="h-4 w-24 bg-surface-container-high" />
            {Array.from({ length: cardCount }, (_, card) => (
              <div
                key={card}
                className="space-y-3 rounded-lg border border-border bg-surface p-4"
              >
                <Skeleton className="h-4 w-3/4 bg-surface-container-high" />
                <Skeleton className="h-3 w-1/2 bg-surface-container-high" />
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-14 rounded-full bg-surface-container-high" />
                  <Skeleton className="h-3 w-16 bg-surface-container-high" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
