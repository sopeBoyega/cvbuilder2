import type { Metadata } from "next";
import Link from "next/link";

import { LegalShell } from "@/components/marketing/legal-shell";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: `About | ${BRAND.name}`,
  description: BRAND.promise,
};

/*
 * The stance, stated outright. Follows the hard copy rules in
 * docs/rebranding.md §5: no auto-reject claims, no interview predictions,
 * parsing claims only. Assume the reader has seen "ATS myths busted"
 * articles; nothing here should contradict them.
 */
export default function AboutPage() {
  return (
    <LegalShell title="About us">
      <p className="text-base text-on-surface">{BRAND.promise}</p>

      <h2>The pitch we refuse to make</h2>
      <p>
        Most tools in this category open with fear: &ldquo;75% of resumes are
        rejected by robots.&rdquo; That number comes from marketing, not
        evidence. Here is what actually happens to your application: it lands
        in recruiting software, where a recruiter searches, filters, and
        skims. Automated rejection is mostly limited to knockout questions
        like work authorization. The software organizes; a person decides.
      </p>
      <p>
        The fear pitch sells a bad fix, too. Tools that promise to
        &ldquo;beat the ATS&rdquo; stuff resumes with keywords until the
        number looks good and the resume reads worse to the human who makes
        the call. We think that trade is a scam, so we built the opposite.
      </p>

      <h2>What we do instead</h2>
      <p>
        You paste a job description and pick a résumé. {BRAND.name} shows a
        transparent match score, spells out which of the role&apos;s terms a
        searching recruiter would find and which are missing, asks you
        targeted questions about real experience you left out, and helps you
        tailor honestly. Then you export a clean, selectable-text PDF or Word
        file that parses correctly, and track the application through to the
        interview.
      </p>

      <h2>Three commitments</h2>
      <ul>
        <li>
          <strong>Job-specific, not generic.</strong> Every suggestion is
          grounded in the actual job description and your actual experience,
          re-scored live as you edit. We will never invent a skill or an
          employer to chase a number.
        </li>
        <li>
          <strong>Actually ATS-safe.</strong> Parsing is the part of the ATS
          story that is real: software can only surface what it can read.
          Our exports are real text, single column, no tables, no words baked
          into images. That claim is testable, and we test it on every
          template.
        </li>
        <li>
          <strong>Transparent and honest.</strong> The match score is our
          diagnostic of relevance and parseability. It is not a number any
          ATS assigns, and we will never tell you it predicts an interview.
          Every score ships with its full breakdown and weights, and the same
          input always produces the same deterministic checks.
        </li>
      </ul>

      <h2>Who it&apos;s built for</h2>
      <p>
        We build first for early-career tech: new grads and developers in
        their first years, where the search is a numbers game of dozens of
        applications and the hardest problem is translating projects,
        internships, and coursework into the language each role uses. If
        that&apos;s you, {BRAND.name} was designed around your week. If
        you&apos;re elsewhere in your career, everything still works; the
        examples will just feel extra tuned to tech.
      </p>

      <h2>What we won&apos;t do</h2>
      <ul>
        <li>
          No invented numbers. You will not find a fake &ldquo;92% success
          rate&rdquo; on our pages; the proof section on our landing page
          stays a placeholder until real users give us real results, with
          permission.
        </li>
        <li>
          No gamed scores. If making your resume better for a human lowers
          the number, we show the lower number.
        </li>
        <li>
          No hoarding your data. The free checker stores nothing you paste.
          Saved resumes are yours and delete from the library menu. Resume
          text is processed by Google&apos;s Gemini API, our only AI
          provider, and nowhere else.
        </li>
      </ul>

      <h2>Say hello</h2>
      <p>
        We&apos;re a small, early-stage team and we read everything. Send
        questions or bugs through the{" "}
        <Link href="/support">support page</Link>, or write to{" "}
        <a href={`mailto:${BRAND.contactEmail}`}>{BRAND.contactEmail}</a>.
        Tell us what works, what doesn&apos;t, and what you wish existed.
      </p>
    </LegalShell>
  );
}
