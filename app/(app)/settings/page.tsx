import { redirect } from "next/navigation";

/** /settings on its own has no content; Profile is the first tab. */
export default function SettingsIndexPage() {
  redirect("/settings/profile");
}
