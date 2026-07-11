import type { Metadata } from "next";

import { AtsCheckerTool } from "@/components/marketing/ats-checker-tool";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Free ATS Resume Checker | ${BRAND.name}`,
  description:
    "Paste a job description and your resume to see which keywords an ATS is scanning for — and which ones you're missing. Free, no account needed.",
};

export default function AtsCheckerPage() {
  return (
    <main className="min-h-dvh bg-background text-on-background">
      <MarketingHeader />

      <div className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <span className="text-xs font-medium uppercase tracking-[0.06em] text-primary">
            Free tool · no account
          </span>
          <h1 className="mt-3 font-heading text-[32px] font-bold leading-[1.15] tracking-tight text-on-surface md:text-[44px]">
            Check your resume before the ATS does
          </h1>
          <p className="mt-4 text-base leading-6 text-on-surface-variant">
            Paste a job description and your resume. We&apos;ll show the
            keywords an applicant tracking system scans for — and which ones
            you&apos;re missing — using the same engine that powers {BRAND.name}.
          </p>
        </div>

        <AtsCheckerTool />

        <p className="mx-auto mt-10 max-w-2xl text-center text-xs text-on-surface-variant">
          Your resume and the job description are used only to compute this
          score and are not stored. Uploaded files are read for their text and
          discarded.
        </p>
      </div>
    </main>
  );
}
