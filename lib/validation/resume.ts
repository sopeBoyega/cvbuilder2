import { z } from "zod";

/**
 * Bump when the shape of `ResumeContent` changes in a non-backward-compatible
 * way. Stored `resume_versions.content` blobs are tagged with the version they
 * were written under so we can migrate them later.
 */
export const resumeSchemaVersion = 1;

/** A single link on the resume header (portfolio, GitHub, LinkedIn, etc.). */
export const ResumeLink = z.object({
  label: z.string().optional(),
  url: z.string(),
});
export type ResumeLink = z.infer<typeof ResumeLink>;

/** Contact block + headline. The only always-present section. */
export const ResumeBasics = z.object({
  name: z.string(),
  email: z.email().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  headline: z.string().optional(),
  links: z.array(ResumeLink).default([]),
});
export type ResumeBasics = z.infer<typeof ResumeBasics>;

/**
 * Dates are kept as free-form strings (e.g. "Jan 2021", "2019", "Present")
 * rather than parsed Dates — resumes are wildly inconsistent and the exporters
 * render them verbatim. `end: null` means "current".
 */
export const WorkEntry = z.object({
  company: z.string(),
  role: z.string(),
  location: z.string().optional(),
  start: z.string().optional(),
  end: z.string().nullable().optional(),
  bullets: z.array(z.string()).default([]),
});
export type WorkEntry = z.infer<typeof WorkEntry>;

export const EducationEntry = z.object({
  school: z.string(),
  degree: z.string().optional(),
  field: z.string().optional(),
  start: z.string().optional(),
  end: z.string().nullable().optional(),
});
export type EducationEntry = z.infer<typeof EducationEntry>;

export const ProjectEntry = z.object({
  name: z.string(),
  description: z.string().optional(),
  url: z.string().optional(),
  bullets: z.array(z.string()).default([]),
});
export type ProjectEntry = z.infer<typeof ProjectEntry>;

export const CertificationEntry = z.object({
  name: z.string(),
  issuer: z.string().optional(),
  year: z.string().optional(),
});
export type CertificationEntry = z.infer<typeof CertificationEntry>;

/**
 * The single JSON shape shared by the parser, the editor, and every exporter
 * (PDF / DOCX / plain-text). Everything except `basics` is optional so a
 * partially-parsed or half-finished resume still satisfies the contract.
 */
export const ResumeContent = z.object({
  basics: ResumeBasics,
  summary: z.string().optional(),
  work: z.array(WorkEntry).default([]),
  education: z.array(EducationEntry).default([]),
  skills: z.array(z.string()).default([]),
  projects: z.array(ProjectEntry).default([]),
  certifications: z.array(CertificationEntry).default([]),
});
export type ResumeContent = z.infer<typeof ResumeContent>;

/** An empty resume, used to seed the "start from scratch" flow. */
export function emptyResumeContent(name = ""): ResumeContent {
  return ResumeContent.parse({ basics: { name } });
}
