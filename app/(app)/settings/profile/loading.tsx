import { Skeleton } from "@/components/ui/skeleton";

/** Content-only: the settings layout (header + tab rail) persists around it. */
export default function ProfileSettingsLoading() {
  return (
    <div className="space-y-6">
      {[0, 1].map((card) => (
        <div
          key={card}
          className="space-y-4 rounded-xl border border-border bg-surface p-6"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="size-8 rounded-lg bg-surface-container-high" />
            <Skeleton className="h-5 w-48 bg-surface-container-high" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Skeleton className="h-9 w-full rounded-lg bg-surface-container-high" />
            <Skeleton className="h-9 w-full rounded-lg bg-surface-container-high" />
          </div>
          <Skeleton className="h-9 w-full rounded-lg bg-surface-container-high" />
        </div>
      ))}
      <div className="flex justify-end">
        <Skeleton className="h-11 w-40 rounded-lg bg-surface-container-high" />
      </div>
    </div>
  );
}
