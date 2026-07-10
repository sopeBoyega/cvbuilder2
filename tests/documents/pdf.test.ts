// @vitest-environment node
import { describe, expect, it } from "vitest";
import { extractText } from "unpdf";

import {
  SAMPLE_RESUME,
  UnknownTemplateError,
  renderResumePdf,
  resolveTemplateId,
} from "@/lib/documents/pdf";
import { DEFAULT_TEMPLATE_ID, TEMPLATES } from "@/lib/documents/templates";

const PDF_MAGIC = "%PDF";

async function textOf(pdf: Buffer): Promise<string> {
  const { text } = await extractText(new Uint8Array(pdf), { mergePages: true });
  return text.replace(/\s+/g, " ");
}

describe("renderResumePdf", () => {
  it("rejects an unknown template", async () => {
    await expect(renderResumePdf("nope", SAMPLE_RESUME)).rejects.toBeInstanceOf(
      UnknownTemplateError,
    );
  });

  for (const template of TEMPLATES) {
    describe(template.name, () => {
      it("produces a real PDF", async () => {
        const pdf = await renderResumePdf(template.id, SAMPLE_RESUME);

        expect(pdf.byteLength).toBeGreaterThan(1000);
        expect(pdf.subarray(0, 4).toString("latin1")).toBe(PDF_MAGIC);
      });

      /*
       * The whole ATS-safe promise rests on the PDF containing real, selectable
       * text rather than a rasterised image. We prove it by extracting the text
       * back out with the same parser we use to read uploaded resumes: if unpdf
       * can read it, an ATS can too.
       */
      it("contains selectable text an ATS can read", async () => {
        const pdf = await renderResumePdf(template.id, SAMPLE_RESUME);
        const text = await textOf(pdf);

        expect(text).toContain("Ada Lovelace");
        expect(text).toContain("ada@example.com");
        expect(text).toContain("Staff Engineer");
        expect(text).toContain("Analytical Engines");
        // A bullet, verbatim.
        expect(text).toContain("cutting median query latency");
        // Skills survive as text, not as graphics.
        expect(text).toContain("Kubernetes");
      });

      it("round-trips every work bullet", async () => {
        const pdf = await renderResumePdf(template.id, SAMPLE_RESUME);
        const text = await textOf(pdf);

        for (const entry of SAMPLE_RESUME.work) {
          for (const bullet of entry.bullets) {
            expect(text).toContain(bullet.slice(0, 40));
          }
        }
      });
    });
  }

  it("renders a resume with only the required fields", async () => {
    const minimal = { ...SAMPLE_RESUME, basics: { name: "Solo", links: [] }, summary: undefined, work: [], education: [], skills: [], projects: [], certifications: [] };
    const pdf = await renderResumePdf(DEFAULT_TEMPLATE_ID, minimal);

    expect(pdf.subarray(0, 4).toString("latin1")).toBe(PDF_MAGIC);
    expect(await textOf(pdf)).toContain("Solo");
  });
});

describe("resolveTemplateId", () => {
  it("passes through a known, renderable template", () => {
    expect(resolveTemplateId("tech-vanguard")).toBe("tech-vanguard");
  });

  it("falls back to the default for unknown or missing ids", () => {
    expect(resolveTemplateId("does-not-exist")).toBe(DEFAULT_TEMPLATE_ID);
    expect(resolveTemplateId(null)).toBe(DEFAULT_TEMPLATE_ID);
    expect(resolveTemplateId(undefined)).toBe(DEFAULT_TEMPLATE_ID);
  });
});
