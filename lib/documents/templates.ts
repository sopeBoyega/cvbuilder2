/**
 * The template registry.
 *
 * Templates are code artifacts (they become @react-pdf/renderer components),
 * not user data — so the registry lives here rather than in the database.
 * `resumes.template_id` stores one of these ids.
 *
 * `renderer: null` means the PDF renderer for this template hasn't been built
 * yet, so the gallery must not offer it as usable. Once a template gains a
 * renderer, the gallery lights it up with no other change.
 */

export type TemplateStyle = "minimal" | "classic" | "modern";

export type ResumeTemplate = {
  id: string;
  name: string;
  description: string;
  style: TemplateStyle;
  /** ATS-safe = real selectable text, single column, no tables or images. */
  atsSafe: boolean;
  /** Null until the @react-pdf/renderer component exists. */
  renderer: null;
};

export const TEMPLATES: readonly ResumeTemplate[] = [
  {
    id: "executive-modern",
    name: "The Executive Modern",
    description:
      "Single column with a strong header. Generous whitespace, typography-led.",
    style: "modern",
    atsSafe: true,
    renderer: null,
  },
  {
    id: "global-standard",
    name: "Global Standard",
    description:
      "Traditional structure that parses cleanly everywhere. The safe default.",
    style: "classic",
    atsSafe: true,
    renderer: null,
  },
  {
    id: "tech-vanguard",
    name: "The Tech Vanguard",
    description:
      "Dense and information-rich, with room for projects and deep skill lists.",
    style: "minimal",
    atsSafe: true,
    renderer: null,
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
  return template.renderer !== null;
}
