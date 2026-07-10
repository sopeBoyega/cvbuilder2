import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";

import type { ResumeContent, WorkEntry } from "@/lib/validation/resume";

/**
 * Server-only. Produces a single-column, real-text .docx from `ResumeContent`.
 *
 * Unlike the PDF export there are no visual template variants: DOCX exists for
 * ATS ingestion and hand-editing in Word, and the safest, most parseable form
 * is one standard single-column layout with real heading styles. So this
 * ignores the chosen template by design.
 */
export async function renderResumeDocx(content: ResumeContent): Promise<Buffer> {
  const { basics } = content;
  const children: Paragraph[] = [];

  children.push(
    new Paragraph({
      heading: HeadingLevel.TITLE,
      children: [new TextRun({ text: basics.name || "Resume", bold: true })],
    }),
  );

  const contact = [basics.headline, basics.email, basics.phone, basics.location]
    .filter(Boolean)
    .join("  •  ");
  if (contact) children.push(plain(contact));

  for (const link of basics.links) {
    children.push(plain(link.label ? `${link.label}: ${link.url}` : link.url));
  }

  if (content.summary) {
    children.push(section("Summary"), plain(content.summary));
  }

  if (content.work.length > 0) {
    children.push(section("Experience"));
    for (const role of content.work) children.push(...workEntry(role));
  }

  if (content.education.length > 0) {
    children.push(section("Education"));
    for (const entry of content.education) {
      const detail = [entry.degree, entry.field].filter(Boolean).join(", ");
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: entry.school, bold: true }),
            ...(detail ? [new TextRun({ text: `  ${detail}` })] : []),
          ],
        }),
      );
      const range = dateRange(entry.start, entry.end);
      if (range) children.push(italic(range));
    }
  }

  if (content.skills.length > 0) {
    children.push(section("Skills"), plain(content.skills.join(", ")));
  }

  if (content.projects.length > 0) {
    children.push(section("Projects"));
    for (const project of content.projects) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: project.name, bold: true })],
        }),
      );
      if (project.description) children.push(plain(project.description));
      for (const line of project.bullets) children.push(bullet(line));
    }
  }

  if (content.certifications.length > 0) {
    children.push(section("Certifications"));
    for (const cert of content.certifications) {
      children.push(
        bullet([cert.name, cert.issuer, cert.year].filter(Boolean).join(" — ")),
      );
    }
  }

  const doc = new Document({ sections: [{ children }] });
  return Packer.toBuffer(doc);
}

function section(title: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 60 },
    children: [new TextRun({ text: title })],
  });
}

function plain(text: string): Paragraph {
  return new Paragraph({ children: [new TextRun({ text })] });
}

function italic(text: string): Paragraph {
  return new Paragraph({ children: [new TextRun({ text, italics: true })] });
}

function bullet(text: string): Paragraph {
  return new Paragraph({ text, bullet: { level: 0 } });
}

function workEntry(role: WorkEntry): Paragraph[] {
  const paragraphs: Paragraph[] = [
    new Paragraph({
      spacing: { before: 120 },
      children: [
        new TextRun({ text: role.role, bold: true }),
        new TextRun({ text: `  ·  ${role.company}` }),
      ],
    }),
  ];

  const meta = [dateRange(role.start, role.end), role.location]
    .filter(Boolean)
    .join("  ·  ");
  if (meta) paragraphs.push(italic(meta));

  for (const line of role.bullets) paragraphs.push(bullet(line));
  return paragraphs;
}

function dateRange(start?: string, end?: string | null): string {
  if (!start && end === undefined) return "";
  const endLabel = end === null ? "Present" : (end ?? "");
  return [start, endLabel].filter(Boolean).join(" – ");
}
