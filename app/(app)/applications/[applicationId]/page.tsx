import Link from "next/link";
import { KanbanSquare } from "lucide-react";

import { AppPageHeader } from "@/components/shell/app-page-header";
import { EmptyState } from "@/components/ui/empty-state";

export default function ApplicationDetailPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-8">
      <AppPageHeader
        title="Application detail"
        description="Track a single opportunity."
      />
      <EmptyState
        icon={KanbanSquare}
        title="Detail view is coming soon"
        description="Notes, timeline, and the tailored resume for a single application will live here. For now, everything happens on the board."
      >
        <Link
          href="/applications"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-container px-5 py-2.5 font-semibold text-on-surface transition-all hover:border-primary hover:text-primary"
        >
          Back to the board
        </Link>
      </EmptyState>
    </div>
  );
}
