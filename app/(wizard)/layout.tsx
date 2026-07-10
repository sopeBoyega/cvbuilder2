import Link from "next/link";
import { X } from "lucide-react";

import { Logo } from "@/components/shell/logo";
import { BRAND } from "@/lib/brand";

/**
 * Focus mode. The tailoring wizard deliberately drops the app sidebar, top nav
 * and mobile bottom bar: the flow is long, the analysis is dense, and the
 * chrome was eating the horizontal space the content needs. The only way out
 * is an explicit Exit — which is the point.
 */
export default function WizardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-dvh bg-background text-on-background">
      <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-md md:px-8">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Logo className="size-6 text-primary" />
          <span className="font-heading text-xl font-bold tracking-tight text-primary">
            {BRAND.name}
          </span>
        </Link>

        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-on-surface-variant transition-colors hover:border-destructive hover:text-destructive"
        >
          <X className="size-4" />
          Exit
        </Link>
      </header>

      <main>{children}</main>
    </div>
  );
}
