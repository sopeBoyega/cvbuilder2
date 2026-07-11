import { Info } from "lucide-react";

import { MarketingHeader } from "@/components/marketing/marketing-header";

/**
 * Shared chrome + typography for hand-written marketing content pages (About,
 * and any template legal text). Pages write plain semantic HTML (h2, p, ul,
 * strong, a) and the wrapper styles it, so each page stays readable prose.
 */
export function LegalShell({
  title,
  updated,
  template = false,
  children,
}: {
  title: string;
  updated?: string;
  /** Shows the "not legal advice" banner. */
  template?: boolean;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-dvh bg-background text-on-background">
      <MarketingHeader />

      <article className="mx-auto max-w-3xl px-6 py-12 md:py-16">
        <h1 className="font-heading text-[32px] font-bold leading-[1.15] tracking-tight text-on-surface md:text-[40px]">
          {title}
        </h1>
        {updated ? (
          <p className="mt-2 text-xs uppercase tracking-[0.06em] text-on-surface-variant">
            Last updated {updated}
          </p>
        ) : null}

        {template ? (
          <div className="mt-6 flex items-start gap-3 rounded-lg border border-coral-hi/20 bg-coral-hi/10 p-4 text-sm text-coral-hi">
            <Info className="mt-0.5 size-4 shrink-0" />
            <span>
              This is a starting template, not legal advice. Have a qualified
              lawyer review and adapt it for your jurisdiction before relying on
              it.
            </span>
          </div>
        ) : null}

        <div className="mt-8 space-y-5 text-sm leading-7 text-on-surface-variant [&_a]:text-primary [&_a]:underline [&_h2]:mt-10 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-on-surface [&_li]:pl-1 [&_strong]:font-semibold [&_strong]:text-on-surface [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6">
          {children}
        </div>
      </article>
    </main>
  );
}
