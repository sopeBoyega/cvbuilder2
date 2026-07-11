"use server";

import { extractJobKeywords, matchKeywords } from "@/lib/ats";
import {
  MAX_FILE_BYTES,
  extractTextFromFile,
} from "@/lib/documents/extract-text";
import { MIN_JD_LENGTH } from "@/lib/validation/job";

/**
 * Public, unauthenticated ATS keyword check — the marketing lead magnet.
 *
 * Deliberately deterministic and AI-free: it runs the same keyword engine the
 * app uses, but never calls Gemini, touches the database, or requires a login.
 * That makes it abuse-proof (worst case is some CPU) and free to run for
 * anonymous visitors. The full structured score (structure, formatting,
 * semantic) and tailoring live behind sign-up.
 */

const MIN_RESUME_LENGTH = 120;

export type AtsCheckResult =
  | {
      ok: true;
      coverage: number;
      matched: string[];
      missing: string[];
      total: number;
    }
  | { ok: false; error: string };

export async function checkAtsMatch(
  formData: FormData,
): Promise<AtsCheckResult> {
  const jobDescription = String(formData.get("jobDescription") ?? "").trim();
  const pasted = String(formData.get("resumeText") ?? "").trim();
  const file = formData.get("file");

  if (jobDescription.length < MIN_JD_LENGTH) {
    return {
      ok: false,
      error: `Paste at least ${MIN_JD_LENGTH} characters of the job description.`,
    };
  }

  // Prefer pasted text; fall back to extracting an uploaded file (no AI —
  // unpdf/mammoth pull raw text only).
  let resumeText = pasted;
  if (resumeText.length < MIN_RESUME_LENGTH && file instanceof File && file.size > 0) {
    if (file.size > MAX_FILE_BYTES) {
      return { ok: false, error: "That file is too large (max 10 MB)." };
    }
    try {
      resumeText = await extractTextFromFile(file);
    } catch (error) {
      return {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "We couldn't read that file. Paste the text instead.",
      };
    }
  }

  if (resumeText.length < MIN_RESUME_LENGTH) {
    return {
      ok: false,
      error: "Add your resume — paste the text or upload a PDF/Word file.",
    };
  }

  const keywords = extractJobKeywords(jobDescription);
  const match = matchKeywords(keywords, resumeText);
  if (match.score === null) {
    return {
      ok: false,
      error: "We couldn't extract keywords from that job description.",
    };
  }

  return {
    ok: true,
    coverage: Math.round(match.score),
    matched: match.matched,
    missing: match.missing,
    total: keywords.length,
  };
}
