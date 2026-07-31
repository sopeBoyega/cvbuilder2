import { isStopword } from "@/lib/ats/stopwords";
import { tokenize } from "@/lib/ats/text";
import type { ResumeContent } from "@/lib/validation/resume";

/**
 * Extraction fidelity: how much of the *source document* survived into the
 * structured `ResumeContent`.
 *
 * This is the one check that needs `resume_versions.raw_text` — once text is
 * structured, anything the parser dropped is invisible. Comparing the two is
 * the closest honest answer we can give to "what does a machine actually read
 * off my resume?", and it's the only signal here that isn't derivable from the
 * structured content alone.
 *
 * Deliberately NOT folded into the ATS score. Section headings ("EXPERIENCE"),
 * page numbers, and address lines legitimately don't survive structuring, so
 * perfect coverage is neither achievable nor desirable — a scored version
 * would just punish normal resumes. It's a diagnostic, and the *dropped lines*
 * are the actionable part.
 */

/** Below this a line is a heading or artifact, not content worth flagging. */
const MIN_DROPPED_LINE_WORDS = 6;
/** A line counts as dropped when less than this share of its words survived. */
const SURVIVAL_THRESHOLD = 0.5;
/** Enough to show a pattern without turning the report into a wall of text. */
const MAX_DROPPED_LINES = 8;

export type ExtractionReport = {
  /**
   * False when the version has no stored source text (built from scratch, or
   * imported before raw text was retained). Everything else is then empty —
   * callers must show "not available", never a 0% that reads as a failure.
   */
  available: boolean;
  /** 0–100 share of distinct meaningful source words present in the structure. */
  coverage: number | null;
  /** Distinct meaningful words in the source document. */
  sourceWords: number;
  /** How many of those appear in the structured content. */
  capturedWords: number;
  /** Source lines that largely failed to survive structuring. */
  droppedLines: string[];
};

/** Meaningful, deduped words — filler and bare numbers carry no signal. */
function contentTokens(text: string): Set<string> {
  return new Set(
    tokenize(text).filter(
      (token) => !isStopword(token) && !/^[0-9.]+$/.test(token),
    ),
  );
}

/**
 * Every string the structured resume holds — deliberately NOT `resumeToText`,
 * which omits email, phone and links because they aren't keywords. Here they
 * matter most: "did my email survive parsing?" is exactly the question this
 * check exists to answer.
 */
function structuredText(content: ResumeContent): string {
  const { basics } = content;
  const parts: string[] = [
    basics.name,
    basics.email ?? "",
    basics.phone ?? "",
    basics.location ?? "",
    basics.headline ?? "",
    ...basics.links.flatMap((link) => [link.label ?? "", link.url]),
    content.summary ?? "",
  ];

  for (const entry of content.work) {
    parts.push(
      entry.company,
      entry.role,
      entry.location ?? "",
      entry.start ?? "",
      entry.end ?? "",
      ...entry.bullets,
    );
  }
  for (const entry of content.education) {
    parts.push(
      entry.school,
      entry.degree ?? "",
      entry.field ?? "",
      entry.start ?? "",
      entry.end ?? "",
    );
  }
  for (const entry of content.projects) {
    parts.push(
      entry.name,
      entry.description ?? "",
      entry.url ?? "",
      ...entry.bullets,
    );
  }
  for (const entry of content.certifications) {
    parts.push(entry.name, entry.issuer ?? "", entry.year ?? "");
  }
  parts.push(...content.skills);

  return parts.filter(Boolean).join(" \n ");
}

export function analyzeExtraction(
  rawText: string | null | undefined,
  content: ResumeContent,
): ExtractionReport {
  const empty: ExtractionReport = {
    available: false,
    coverage: null,
    sourceWords: 0,
    capturedWords: 0,
    droppedLines: [],
  };
  if (!rawText?.trim()) return empty;

  const source = contentTokens(rawText);
  if (source.size === 0) return empty;

  const structured = contentTokens(structuredText(content));
  let captured = 0;
  for (const token of source) if (structured.has(token)) captured++;

  const droppedLines: string[] = [];
  for (const line of rawText.split(/\r?\n/)) {
    if (droppedLines.length >= MAX_DROPPED_LINES) break;
    const trimmed = line.trim();
    if (!trimmed) continue;

    const tokens = [...contentTokens(trimmed)];
    if (tokens.length < MIN_DROPPED_LINE_WORDS) continue;

    const survived = tokens.filter((token) => structured.has(token)).length;
    if (survived / tokens.length < SURVIVAL_THRESHOLD) {
      droppedLines.push(trimmed);
    }
  }

  return {
    available: true,
    coverage: Math.round((captured / source.size) * 100),
    sourceWords: source.size,
    capturedWords: captured,
    droppedLines,
  };
}

/** One row of the "what the parser extracted" panel. */
export type ExtractedField = {
  label: string;
  /** Null renders as a red `null` — the field genuinely wasn't found. */
  value: string | null;
  /** Missing this field materially hurts parsing or contactability. */
  critical: boolean;
};

export type ExtractedGroup = {
  name: string;
  fields: ExtractedField[];
};

/** `start → end` as the resume worded it, or null when no dates parsed. */
function dateRange(start?: string, end?: string | null): string | null {
  if (!start) return null;
  return `${start} → ${end ?? "present"}`;
}

/**
 * Flattens `ResumeContent` into the labelled groups the parse preview renders.
 *
 * Completeness is the contract: every section, every entry, every bullet,
 * verbatim. Summarising ("5 bullets found") would defeat the entire purpose —
 * a user cannot verify that a bullet survived parsing unless they can read it.
 * Absence is shown explicitly too: a missing phone is a `null` row, not a
 * hidden one, because seeing what the machine did *not* find is the point.
 */
export function toExtractedGroups(content: ResumeContent): ExtractedGroup[] {
  const { basics } = content;

  const groups: ExtractedGroup[] = [
    {
      name: "contact",
      fields: [
        { label: "name", value: basics.name.trim() || null, critical: true },
        { label: "email", value: basics.email ?? null, critical: true },
        { label: "phone", value: basics.phone ?? null, critical: false },
        { label: "location", value: basics.location ?? null, critical: false },
        { label: "headline", value: basics.headline ?? null, critical: false },
        {
          label: `links[${basics.links.length}]`,
          value: basics.links.length
            ? basics.links
                .map((link) => (link.label ? `${link.label}: ${link.url}` : link.url))
                .join("  ·  ")
            : null,
          critical: false,
        },
      ],
    },
    {
      name: "summary",
      fields: [
        {
          label: "text",
          value: content.summary?.trim() || null,
          critical: false,
        },
      ],
    },
  ];

  groups.push({
    name: `experience[${content.work.length}]`,
    fields: content.work.length
      ? content.work.flatMap((entry, index) => [
          {
            label: `${index}.role`,
            value: entry.role.trim() || null,
            critical: true,
          },
          {
            label: `${index}.company`,
            value: entry.company.trim() || null,
            critical: true,
          },
          {
            label: `${index}.location`,
            value: entry.location ?? null,
            critical: false,
          },
          {
            label: `${index}.dates`,
            value: dateRange(entry.start, entry.end),
            critical: true,
          },
          // Verbatim, one row each — the only way to confirm a bullet parsed.
          ...(entry.bullets.length
            ? entry.bullets.map((bullet, bulletIndex) => ({
                label: `${index}.bullets[${bulletIndex}]`,
                value: bullet,
                critical: false,
              }))
            : [
                {
                  label: `${index}.bullets`,
                  value: null,
                  critical: true,
                },
              ]),
        ])
      : [{ label: "entries", value: null, critical: true }],
  });

  groups.push({
    name: `education[${content.education.length}]`,
    fields: content.education.length
      ? content.education.flatMap((entry, index) => [
          {
            label: `${index}.school`,
            value: entry.school.trim() || null,
            critical: false,
          },
          {
            label: `${index}.degree`,
            value:
              [entry.degree, entry.field].filter(Boolean).join(", ") || null,
            critical: false,
          },
          {
            label: `${index}.dates`,
            value: dateRange(entry.start, entry.end),
            critical: false,
          },
        ])
      : [{ label: "entries", value: null, critical: false }],
  });

  groups.push({
    name: `skills[${content.skills.length}]`,
    fields: [
      {
        label: "list",
        value: content.skills.length ? content.skills.join(", ") : null,
        critical: true,
      },
    ],
  });

  groups.push({
    name: `projects[${content.projects.length}]`,
    fields: content.projects.length
      ? content.projects.flatMap((entry, index) => [
          {
            label: `${index}.name`,
            value: entry.name.trim() || null,
            critical: false,
          },
          {
            label: `${index}.description`,
            value: entry.description?.trim() || null,
            critical: false,
          },
          ...entry.bullets.map((bullet, bulletIndex) => ({
            label: `${index}.bullets[${bulletIndex}]`,
            value: bullet,
            critical: false,
          })),
        ])
      : [{ label: "entries", value: null, critical: false }],
  });

  groups.push({
    name: `certifications[${content.certifications.length}]`,
    fields: content.certifications.length
      ? content.certifications.map((entry, index) => ({
          label: `${index}`,
          value:
            [entry.name, entry.issuer, entry.year].filter(Boolean).join(" · ") ||
            null,
          critical: false,
        }))
      : [{ label: "entries", value: null, critical: false }],
  });

  return groups;
}
