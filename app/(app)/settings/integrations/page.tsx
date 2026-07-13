import { Unplug } from "lucide-react";

import { AppPageHeader } from "@/components/shell/app-page-header";
import { EmptyState } from "@/components/ui/empty-state";

export default function IntegrationsSettingsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 md:p-8">
      <AppPageHeader
        title="Integrations"
        description="Connect external tools."
      />
      <EmptyState
        icon={Unplug}
        title="No integrations yet"
        description="Connections to job boards and calendars are planned but not built. Anything you connect will be listed and managed from here."
      />
    </div>
  );
}
