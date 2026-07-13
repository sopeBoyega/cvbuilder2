import { Mail } from "lucide-react";

import { AppPageHeader } from "@/components/shell/app-page-header";
import { EmptyState } from "@/components/ui/empty-state";

export default function CoverLetterPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-8">
      <AppPageHeader
        title="Cover letter"
        description="Draft and refine a letter."
      />
      <EmptyState
        icon={Mail}
        title="Cover letters are coming soon"
        description="AI-drafted cover letters grounded in your resume and the job description are next on the roadmap. Nothing can be generated yet."
      />
    </div>
  );
}
