/**
 * The template registry — metadata only.
 *
 * Templates are code artifacts (their PDF renderers live in
 * `lib/documents/pdf/`), not user data, so the registry lives here rather than
 * in the database. `resumes.template_id` stores one of these ids.
 *
 * Deliberately free of any @react-pdf/renderer import: the client-side gallery
 * imports this module, and react-pdf must never reach the browser bundle.
 */

export type TemplateStyle = "minimal" | "classic" | "modern";

export type ResumeTemplate = {
  id: string;
  name: string;
  description: string;
  style: TemplateStyle;
  /** ATS-safe = real selectable text, single column, no tables or images. */
  atsSafe: boolean;
  /** False when no PDF renderer exists for this template yet. */
  available: boolean;
};

export const DEFAULT_TEMPLATE_ID = "global-standard";

export const TEMPLATES: readonly ResumeTemplate[] = [
  {
    id: "executive-modern",
    name: "The Executive Modern",
    description:
      "Single column with a strong header. Generous whitespace, typography-led.",
    style: "modern",
    atsSafe: true,
    available: true,
  },
  {
    id: "global-standard",
    name: "Global Standard",
    description:
      "Traditional structure that parses cleanly everywhere. The safe default.",
    style: "classic",
    atsSafe: true,
    available: true,
  },
  {
    id: "tech-vanguard",
    name: "The Tech Vanguard",
    description:
      "Dense and information-rich, with room for projects and deep skill lists.",
    style: "minimal",
    atsSafe: true,
    available: true,
  },
] as const;

export const TEMPLATE_STYLES: readonly TemplateStyle[] = [
  "minimal",
  "classic",
  "modern",
] as const;

export function getTemplate(id: string): ResumeTemplate | undefined {
  return TEMPLATES.find((template) => template.id === id);
}

/** True once a template can actually produce a PDF. */
export function isTemplateUsable(template: ResumeTemplate): boolean {
  return template.available;
}
