import { Unplug } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";

export default function IntegrationsSettingsPage() {
  return (
    <EmptyState
      icon={Unplug}
      title="No integrations yet"
      description="Connections like LinkedIn sync, Google Drive export, and a Chrome job-capture extension are planned but not built. Anything you connect will be listed and managed from here."
    />
  );
}
