"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Prev/Next pager shared by every client-paginated list (resume library,
 * Discover feed, …). Deliberately simple — no page-number buttons — since
 * these lists run tens of pages at most, not hundreds.
 */
export function Pager({
  page,
  totalPages,
  onChange,
  className,
}: {
  /** 1-indexed. */
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  className?: string;
}) {
  if (totalPages <= 1) return null;

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-4 pt-2",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
        className="flex items-center gap-1 rounded-lg border border-border bg-surface-container-low px-3 py-1.5 text-sm text-on-surface-variant transition-all hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:text-on-surface-variant"
      >
        <ChevronLeft className="size-4" />
        Prev
      </button>
      <span className="font-mono text-xs text-on-surface-variant">
        Page {page} of {totalPages}
      </span>
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
        className="flex items-center gap-1 rounded-lg border border-border bg-surface-container-low px-3 py-1.5 text-sm text-on-surface-variant transition-all hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:text-on-surface-variant"
      >
        Next
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}
