import { UserRound } from "lucide-react";

import { AppPageHeader } from "@/components/shell/app-page-header";
import { EmptyState } from "@/components/ui/empty-state";

export default function ProfileSettingsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 md:p-8">
      <AppPageHeader title="Profile" description="Manage your profile." />
      <EmptyState
        icon={UserRound}
        title="Profile settings are coming soon"
        description="Your name, email, and sign-in are managed through your account menu for now. Target role and job-search preferences will live here."
      />
    </div>
  );
}
