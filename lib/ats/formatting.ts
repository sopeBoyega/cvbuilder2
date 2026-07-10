import { toResult, type LintResult } from "@/lib/ats/structure";
import type { AtsFlag } from "@/lib/validation/ats";
import type { ResumeContent } from "@/lib/validation/resume";

/**
 * Formatting safety.
 *
 * IMPORTANT: the classic ATS-hostile patterns (multi-column layouts, tables,
 * text in headers/footers, uncommon fonts, images carrying text) are properties
 * of the *source document*, and that layout is gone by the time we hold a
 * `ResumeContent`. Detecting those requires the original PDF, which we don't
 * retain. Everything below is what remains checkable from structured content.
 */

/** A bullet longer than this stops being scannable. */
const MAX_BULLET_WORDS = 40;
/** More than this many bullets per role reads as a job description dump. */
const MAX_BULLETS_PER_ROLE = 8;
const MAX_SUMMARY_WORDS = 120;
const MAX_SKILLS = 40;

function words(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** ALL-CAPS runs of 4+ letters, ignoring acronyms like "API" or "SQL". */
function isShouting(text: string): boolean {
  const letters = text.replace(/[^A-Za-z]/g, "");
  if (letters.length < 12) return false;
  const upper = text.replace(/[^A-Z]/g, "").length;
  return upper / letters.length > 0.7;
}

export function lintFormatting(content: ResumeContent): LintResult {
  const allBullets = [
    ...content.work.flatMap((entry) => entry.bullets),
    ...content.projects.flatMap((entry) => entry.bullets),
  ];

  const longBullets = allBullets.filter(
    (bullet) => words(bullet) > MAX_BULLET_WORDS,
  );
  const shoutingBullets = allBullets.filter(isShouting);
  const overStuffedRoles = content.work.filter(
    (entry) => entry.bullets.length > MAX_BULLETS_PER_ROLE,
  );

  const checks: {
    code: string;
    weight: number;
    passed: boolean;
    message: string;
    severity: AtsFlag["severity"];
    section?: string;
  }[] = [
    {
      code: "long_bullets",
      weight: 3,
      passed: longBullets.length === 0,
      message: `${longBullets.length} bullet point(s) exceed ${MAX_BULLET_WORDS} words. Tighten them.`,
      severity: "warning",
      section: "work",
    },
    {
      code: "overstuffed_role",
      weight: 2,
      passed: overStuffedRoles.length === 0,
      message: `${overStuffedRoles.length} role(s) have more than ${MAX_BULLETS_PER_ROLE} bullets. Keep the strongest.`,
      severity: "info",
      section: "work",
    },
    {
      code: "shouting_text",
      weight: 2,
      passed: shoutingBullets.length === 0,
      message: "Some text is in ALL CAPS, which reads as shouting.",
      severity: "warning",
      section: "work",
    },
    {
      code: "long_summary",
      weight: 2,
      passed: !content.summary || words(content.summary) <= MAX_SUMMARY_WORDS,
      message: `Summary is over ${MAX_SUMMARY_WORDS} words. Cut it to a short paragraph.`,
      severity: "info",
      section: "summary",
    },
    {
      code: "too_many_skills",
      weight: 2,
      passed: content.skills.length <= MAX_SKILLS,
      message: `Listing ${content.skills.length} skills dilutes the important ones (max ${MAX_SKILLS}).`,
      severity: "info",
      section: "skills",
    },
    {
      code: "unparseable_links",
      weight: 1,
      passed: content.basics.links.every((link) => link.url.trim().length > 0),
      message: "A link has no URL.",
      severity: "info",
      section: "basics",
    },
  ];

  return toResult(checks);
}
