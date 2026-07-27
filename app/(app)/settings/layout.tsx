import { SettingsNav } from "@/components/settings/settings-nav";

/**
 * Shared shell for every settings sub-page: one header + the tab rail, with
 * the active section rendering beside it. Sub-pages return content only (no
 * containers or page headers of their own).
 */
export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-5xl p-4 md:p-8">
      <header>
        <h1 className="font-heading text-[30px] font-semibold leading-[1.2] text-on-surface">
          Settings
        </h1>
        <p className="mt-2 text-on-surface-variant">
          Manage your account preferences and professional targeting.
        </p>
      </header>

      <div className="mt-8 flex flex-col gap-6 md:grid md:grid-cols-[200px_1fr] md:items-start">
        <SettingsNav />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
