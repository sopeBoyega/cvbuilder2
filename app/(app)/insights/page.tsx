import Link from "next/link";
import { ChartNoAxesColumn, Send } from "lucide-react";

import { AppPageHeader } from "@/components/shell/app-page-header";
import { EmptyState } from "@/components/ui/empty-state";

export default function InsightsPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">
      <AppPageHeader title="Insights" description="Job-search analytics." />
      <EmptyState
        icon={ChartNoAxesColumn}
        title="Insights are coming soon"
        description="Response rates, score trends, and what's working in your search will appear here — built from the applications you track. Nothing is measured yet."
      >
        <Link
          href="/applications"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-container px-5 py-2.5 font-semibold text-on-surface transition-all hover:border-primary hover:text-primary"
        >
          <Send className="size-4" />
          Track your applications
        </Link>
      </EmptyState>
    </div>
  );
}
