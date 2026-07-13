import { MessagesSquare } from "lucide-react";

import { AppPageHeader } from "@/components/shell/app-page-header";
import { EmptyState } from "@/components/ui/empty-state";

export default function InterviewPrepPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-8">
      <AppPageHeader
        title="Interview prep"
        description="Practice for a tracked application."
      />
      <EmptyState
        icon={MessagesSquare}
        title="Interview prep is coming soon"
        description="Practice questions built from the job description and your resume will appear here once this feature ships."
      />
    </div>
  );
}
