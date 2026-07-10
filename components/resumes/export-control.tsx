"use client";

import { useState, useTransition } from "react";
import { ChevronDown, Download } from "lucide-react";

import { setResumeTemplate } from "@/lib/actions/resume";
import { DEFAULT_TEMPLATE_ID, TEMPLATES } from "@/lib/documents/templates";

/**
 * Template picker + download. The download is a plain anchor to the route
 * handler rather than a fetch+blob dance — the browser already knows how to
 * save a `Content-Disposition: attachment` response.
 */
export function ExportControl({
  resumeId,
  versionId,
  initialTemplateId,
}: {
  resumeId: string;
  /** Export a specific version (a tailored variant) instead of the base. */
  versionId?: string;
  initialTemplateId?: string | null;
}) {
  const [templateId, setTemplateId] = useState(
    initialTemplateId ?? DEFAULT_TEMPLATE_ID,
  );
  const [, startTransition] = useTransition();

  const pdfParams = new URLSearchParams({ template: templateId });
  if (versionId) pdfParams.set("version", versionId);

  // DOCX ignores the visual template (single ATS-safe layout), so it only
  // needs the version.
  const docxParams = new URLSearchParams();
  if (versionId) docxParams.set("version", versionId);

  function choose(next: string) {
    setTemplateId(next);
    // Remember the choice, but never block the download on it.
    startTransition(() => {
      void setResumeTemplate({ resumeId, templateId: next });
    });
  }

  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <select
          aria-label="PDF template"
          value={templateId}
          onChange={(event) => choose(event.target.value)}
          className="cursor-pointer appearance-none rounded-lg border border-border bg-surface py-2 pl-3 pr-9 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary/40"
        >
          {TEMPLATES.filter((template) => template.available).map((template) => (
            <option key={template.id} value={template.id}>
              {template.name}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant" />
      </div>

      <a
        href={`/api/resumes/${resumeId}/pdf?${pdfParams.toString()}`}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition-all hover:brightness-110"
      >
        <Download className="size-4" />
        Download PDF
      </a>

      <a
        href={`/api/resumes/${resumeId}/docx?${docxParams.toString()}`}
        className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold text-on-surface transition-all hover:border-primary hover:text-primary"
      >
        <Download className="size-4" />
        Download DOCX
      </a>
    </div>
  );
}
