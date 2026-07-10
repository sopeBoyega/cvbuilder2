import { type NextRequest, NextResponse } from "next/server";

import {
  SAMPLE_RESUME,
  renderResumePdf,
  resolveTemplateId,
} from "@/lib/documents/pdf";
import { getTemplate } from "@/lib/documents/templates";

export const runtime = "nodejs";

/**
 * `GET /api/templates/:templateId/preview`
 *
 * Renders the fictional sample resume through a template. Public and cacheable
 * — it contains no user data, so it's the one PDF route that may be cached.
 * Displayed inline so it opens in a tab rather than downloading.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> },
) {
  const { templateId } = await params;
  if (!getTemplate(templateId)) {
    return NextResponse.json({ error: "Unknown template" }, { status: 404 });
  }

  const pdf = await renderResumePdf(resolveTemplateId(templateId), SAMPLE_RESUME);

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${templateId}-preview.pdf"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
