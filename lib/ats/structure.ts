import { wordCount } from "@/lib/ats/text";
import type { AtsFlag } from "@/lib/validation/ats";
import type { ResumeContent } from "@/lib/validation/resume";

/** Resumes shorter/longer than this read as thin or bloated to a recruiter. */
const MIN_WORDS = 150;
const MAX_WORDS = 1200;

type Check = {
  code: string;
  weight: number;
  passed: boolean;
  message: string;
  severity: AtsFlag["severity"];
  section?: string;
};

export type LintResult = {
  score: number;
  flags: AtsFlag[];
};

/**
 * Structure completeness: are the sections an ATS expects present, and is the
 * contact information parseable? Weighted so a missing email hurts far more
 * than a missing certifications list.
 */
export function lintStructure(content: ResumeContent): LintResult {
  const { basics } = content;
  const words = wordCount(content);
  const datedRoles = content.work.filter((entry) => Boolean(entry.start));
  const rolesWithBullets = content.work.filter(
    (entry) => entry.bullets.length > 0,
  );

  const checks: Check[] = [
    {
      code: "missing_name",
      weight: 3,
      passed: basics.name.trim().length > 0,
      message: "No name found at the top of the resume.",
      severity: "error",
      section: "basics",
    },
    {
      code: "missing_email",
      weight: 3,
      passed: Boolean(basics.email),
      message: "No email address. Most ATS reject resumes they can't contact.",
      severity: "error",
      section: "basics",
    },
    {
      code: "missing_phone",
      weight: 1,
      passed: Boolean(basics.phone),
      message: "No phone number found.",
      severity: "info",
      section: "basics",
    },
    {
      code: "missing_summary",
      weight: 1,
      passed: Boolean(content.summary?.trim()),
      message: "No professional summary. A short one improves keyword coverage.",
      severity: "info",
      section: "summary",
    },
    {
      code: "missing_work",
      weight: 4,
      passed: content.work.length > 0,
      message: "No work experience section.",
      severity: "error",
      section: "work",
    },
    {
      code: "missing_bullets",
      weight: 2,
      passed: content.work.length === 0 || rolesWithBullets.length > 0,
      message: "No role describes what you actually did. Add bullet points.",
      severity: "warning",
      section: "work",
    },
    {
      code: "missing_dates",
      weight: 2,
      passed: content.work.length === 0 || datedRoles.length === content.work.length,
      message: "Some roles have no start date. ATS use dates to compute tenure.",
      severity: "warning",
      section: "work",
    },
    {
      code: "missing_education",
      weight: 1,
      passed: content.education.length > 0 || content.projects.length > 0,
      message: "No education or projects section.",
      severity: "info",
      section: "education",
    },
    {
      code: "missing_skills",
      weight: 3,
      passed: content.skills.length > 0,
      message: "No skills section. This is where keyword matching pays off.",
      severity: "error",
      section: "skills",
    },
    {
      code: "length_out_of_range",
      weight: 2,
      passed: words >= MIN_WORDS && words <= MAX_WORDS,
      message:
        words < MIN_WORDS
          ? `Resume is very short (${words} words). Aim for ${MIN_WORDS}+.`
          : `Resume is long (${words} words). Aim for under ${MAX_WORDS}.`,
      severity: "warning",
    },
  ];

  return toResult(checks);
}

export function toResult(checks: Check[]): LintResult {
  const total = checks.reduce((sum, check) => sum + check.weight, 0);
  const earned = checks
    .filter((check) => check.passed)
    .reduce((sum, check) => sum + check.weight, 0);

  const flags = checks
    .filter((check) => !check.passed)
    .map(({ code, message, severity, section }) => ({
      code,
      message,
      severity,
      ...(section ? { section } : {}),
    }));

  return { score: total === 0 ? 100 : (earned / total) * 100, flags };
}
