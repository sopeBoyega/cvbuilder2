import { renderToBuffer } from "@react-pdf/renderer";

import {
  ExecutiveModern,
  GlobalStandard,
  TechVanguard,
} from "@/lib/documents/pdf/templates";
import { DEFAULT_TEMPLATE_ID, getTemplate } from "@/lib/documents/templates";
import { ResumeContent } from "@/lib/validation/resume";

/**
 * Server-only. Kept out of `lib/documents/templates.ts` (which the gallery
 * imports on the client) so @react-pdf/renderer and its Node deps never reach
 * the browser bundle.
 */

type TemplateComponent = (props: { content: ResumeContent }) => React.ReactElement;

const RENDERERS: Record<string, TemplateComponent> = {
  "executive-modern": ExecutiveModern,
  "global-standard": GlobalStandard,
  "tech-vanguard": TechVanguard,
};

export class UnknownTemplateError extends Error {
  constructor(templateId: string) {
    super(`No PDF renderer for template "${templateId}".`);
    this.name = "UnknownTemplateError";
  }
}

/** Renders a resume to a real, selectable-text PDF. */
export async function renderResumePdf(
  templateId: string,
  content: ResumeContent,
): Promise<Buffer> {
  const Template = RENDERERS[templateId];
  if (!Template) throw new UnknownTemplateError(templateId);

  return renderToBuffer(<Template content={content} />);
}

/** Falls back to the default template when the id is unknown or missing. */
export function resolveTemplateId(candidate: string | null | undefined): string {
  if (candidate && getTemplate(candidate) && RENDERERS[candidate]) {
    return candidate;
  }
  return DEFAULT_TEMPLATE_ID;
}

/**
 * Fictional content used only for the gallery's template previews. It is never
 * shown as, or confused with, a real user's resume.
 */
export const SAMPLE_RESUME: ResumeContent = ResumeContent.parse({
  basics: {
    name: "Ada Lovelace",
    headline: "Senior Product Engineer",
    email: "ada@example.com",
    phone: "+44 20 7946 0958",
    location: "London, UK",
  },
  summary:
    "Product engineer with nine years building data-heavy web platforms. Ships end to end, from schema to interface, and leads small teams without losing hands-on depth.",
  work: [
    {
      company: "Analytical Engines",
      role: "Staff Engineer",
      location: "London",
      start: "2021",
      end: null,
      bullets: [
        "Led the rebuild of the reporting platform, cutting median query latency from 4.2s to 380ms.",
        "Grew the platform team from three to nine engineers and introduced a design-review practice.",
        "Shipped a self-serve analytics API now used by 140 enterprise customers.",
      ],
    },
    {
      company: "Difference Ltd",
      role: "Senior Software Engineer",
      location: "Cambridge",
      start: "2017",
      end: "2021",
      bullets: [
        "Migrated a monolith to event-driven services, halving deploy time.",
        "Owned the billing subsystem end to end, including a zero-downtime pricing migration.",
      ],
    },
  ],
  education: [
    { school: "University of Cambridge", degree: "BA", field: "Mathematics", start: "2013", end: "2016" },
  ],
  skills: [
    "TypeScript", "React", "Node.js", "PostgreSQL", "Kubernetes",
    "Terraform", "GraphQL", "System design", "Mentoring",
  ],
  projects: [
    {
      name: "Notational",
      description: "Open-source notebook runtime with 4k GitHub stars.",
      bullets: ["Designed the incremental execution engine."],
    },
  ],
  certifications: [
    { name: "Certified Kubernetes Administrator", issuer: "CNCF", year: "2022" },
  ],
});
