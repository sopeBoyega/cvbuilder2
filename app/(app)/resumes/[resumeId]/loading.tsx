import { Skeleton } from "@/components/ui/skeleton";

/** Mirrors the resume detail layout: toolbar, then the document preview. */
export default function ResumeDetailLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 p-4 md:p-8">
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-5 w-36 bg-surface-container-high" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24 rounded-lg bg-surface-container-high" />
          <Skeleton className="h-10 w-28 rounded-lg bg-surface-container-high" />
        </div>
      </div>

      <div className="space-y-8 rounded-xl border border-border bg-surface p-6 md:p-10">
        {/* Name + contact strip */}
        <div className="space-y-3">
          <Skeleton className="h-8 w-64 bg-surface-container-high" />
          <div className="flex flex-wrap gap-4">
            <Skeleton className="h-4 w-40 bg-surface-container-high" />
            <Skeleton className="h-4 w-32 bg-surface-container-high" />
            <Skeleton className="h-4 w-36 bg-surface-container-high" />
          </div>
        </div>

        {/* Body sections */}
        {[0, 1, 2].map((section) => (
          <div key={section} className="space-y-3">
            <Skeleton className="h-5 w-40 bg-surface-container-high" />
            <Skeleton className="h-3 w-full bg-surface-container-high" />
            <Skeleton className="h-3 w-full bg-surface-container-high" />
            <Skeleton className="h-3 w-3/4 bg-surface-container-high" />
          </div>
        ))}
      </div>
    </div>
  );
}
