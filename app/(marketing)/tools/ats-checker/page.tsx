import type { Metadata } from "next";

import { AtsCheckerTool } from "@/components/marketing/ats-checker-tool";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Free ATS Resume Checker | ${BRAND.name}`,
  description:
    "Paste a job description and your resume to see which of the role's keywords a recruiter would find in your resume, and which are missing. Free, no account needed.",
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
            See your resume the way a recruiter searches it
          </h1>
          <p className="mt-4 text-base leading-6 text-on-surface-variant">
            Paste a job description and your resume. We&apos;ll show which of
            the role&apos;s keywords show up in your resume and which are
            missing, using the same engine that powers {BRAND.name}. Not a
            robot verdict: a relevance check you can act on.
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
