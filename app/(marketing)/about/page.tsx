import type { Metadata } from "next";

import { LegalShell } from "@/components/marketing/legal-shell";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: `About | ${BRAND.name}`,
  description: BRAND.description,
};

export default function AboutPage() {
  return (
    <LegalShell title="About us">
      <p className="text-base text-on-surface">{BRAND.promise}</p>

      <p>
        Most résumés are read by software before a person ever sees them. An
        applicant tracking system scans for the right keywords, a parseable
        structure, and a clean format, and quietly filters out the rest.{" "}
        {BRAND.name} exists to help you get past that first reader.
      </p>

      <h2>What we do</h2>
      <p>
        You paste a job description and pick a résumé. We show your ATS score
        before you apply, spell out exactly which keywords matched and which are
        missing, and help you tailor the résumé. Then you export a clean,
        selectable-text file an ATS can actually read.
      </p>

      <h2>Why we&apos;re different</h2>
      <ul>
        <li>
          <strong>The score is explainable.</strong> We don&apos;t hand you a
          mystery number. Every score breaks down into keyword coverage,
          structure, and formatting, so you know what to fix.
        </li>
        <li>
          <strong>Deterministic where it counts.</strong> The core scoring is
          transparent logic, not a black box: the same input always gives the
          same result.
        </li>
        <li>
          <strong>Honest by default.</strong> We&apos;ll never encourage you to
          claim a skill you don&apos;t have. The goal is to present your real
          experience in the language the job is looking for.
        </li>
      </ul>

      <h2>Who it&apos;s for</h2>
      <p>
        Job seekers applying online, where an ATS is the first thing between you
        and a callback, from recent graduates to mid-career switchers. Start
        free; upgrade only when a serious search makes it worth it.
      </p>

      <h2>Say hello</h2>
      <p>
        We&apos;re a small, early-stage team and we read everything. Tell us what
        works, what doesn&apos;t, and what you wish existed at{" "}
        <a href={`mailto:${BRAND.contactEmail}`}>{BRAND.contactEmail}</a>.
      </p>
    </LegalShell>
  );
}
