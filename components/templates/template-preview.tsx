import type { TemplateStyle } from "@/lib/documents/templates";
import { cn } from "@/lib/utils";

/**
 * A CSS mock of the template's page layout. Deliberately not a stock photo and
 * not a real render — it conveys structure without pretending the PDF exists.
 */
export function TemplatePreview({ style }: { style: TemplateStyle }) {
  return (
    <div className="flex aspect-[3/4] items-center justify-center overflow-hidden bg-surface-container-highest p-4">
      <div className="flex h-full w-full flex-col gap-2 rounded-sm bg-[#e8eaf0] p-4 shadow-lg">
        {style === "modern" ? (
          <>
            <div className="h-4 w-2/3 rounded-xs bg-[#1b2333]" />
            <div className="h-1 w-1/3 rounded-full bg-[#5bc06b]" />
            <div className="mt-2 space-y-1.5">
              <Lines count={3} />
            </div>
            <div className="mt-auto space-y-1.5">
              <Lines count={4} />
            </div>
          </>
        ) : style === "classic" ? (
          <>
            <div className="mx-auto h-3 w-1/2 rounded-xs bg-[#1b2333]" />
            <div className="mx-auto h-1 w-1/4 rounded-full bg-[#9aa0ac]" />
            <div className="mt-3 h-px w-full bg-[#c3c8d4]" />
            <div className="mt-2 space-y-1.5">
              <Lines count={6} />
            </div>
            <div className="mt-auto h-px w-full bg-[#c3c8d4]" />
          </>
        ) : (
          <>
            <div className="h-2.5 w-1/2 rounded-xs bg-[#1b2333]" />
            <div className="mt-4 space-y-2">
              <Lines count={8} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Lines({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className={cn(
            "h-1 rounded-full bg-[#c3c8d4]",
            index % 3 === 2 ? "w-2/3" : "w-full",
          )}
        />
      ))}
    </>
  );
}
