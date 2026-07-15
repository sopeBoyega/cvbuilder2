import { BellOff } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";

export default function NotificationsSettingsPage() {
  return (
    <EmptyState
      icon={BellOff}
      title="No notification settings yet"
      description="CVBuilder doesn't send emails or alerts yet, so there's nothing to configure. Preferences will appear here when notifications ship."
    />
  );
}
