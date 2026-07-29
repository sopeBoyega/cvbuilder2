export default function DeepScanLoading() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse space-y-6 p-4 md:p-8">
      <div className="h-4 w-40 rounded bg-surface-container-high" />

      <div className="flex flex-col justify-between gap-6 rounded-xl border border-border bg-surface-container p-6 md:flex-row md:items-center md:p-8">
        <div className="space-y-3">
          <div className="h-10 w-64 rounded bg-surface-container-high" />
          <div className="h-4 w-full max-w-xl rounded bg-surface-container-high" />
        </div>
        <div className="size-[120px] shrink-0 rounded-full bg-surface-container-high" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="h-[28rem] rounded-xl border border-border bg-surface" />
        <div className="space-y-4">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className="h-40 rounded-xl border border-border bg-surface"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
