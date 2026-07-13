import { BellOff } from "lucide-react";

import { AppPageHeader } from "@/components/shell/app-page-header";
import { EmptyState } from "@/components/ui/empty-state";

export default function NotificationsSettingsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 md:p-8">
      <AppPageHeader
        title="Notifications"
        description="Manage notification preferences."
      />
      <EmptyState
        icon={BellOff}
        title="No notification settings yet"
        description="CVBuilder doesn't send emails or alerts yet, so there's nothing to configure. Preferences will appear here when notifications ship."
      />
    </div>
  );
}
