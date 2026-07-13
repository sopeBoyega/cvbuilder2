"use server";

import { z } from "zod";

import { db } from "@/lib/db";
import { leads } from "@/lib/db/schema";

/**
 * Public, unauthenticated lead capture — the email box on ATS-checker results.
 * Stores the email only (the checker page promises resume/JD text is never
 * kept). Duplicate submissions are a silent success so nobody is told
 * "already subscribed" — that leaks whether an email is known.
 */

const LeadInput = z.object({
  email: z.email("Enter a valid email address."),
  source: z.enum(["ats_checker"]),
  /** Keyword coverage shown at capture; null if somehow absent. */
  checkerScore: z.number().int().min(0).max(100).nullable(),
});

export type CaptureLeadResult = { ok: true } | { ok: false; error: string };

export async function captureLead(
  input: z.infer<typeof LeadInput>,
): Promise<CaptureLeadResult> {
  const parsed = LeadInput.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Enter a valid email address.",
    };
  }

  const { email, source, checkerScore } = parsed.data;

  try {
    await db
      .insert(leads)
      .values({ email: email.toLowerCase(), source, checkerScore })
      .onConflictDoNothing();
    return { ok: true };
  } catch {
    // Never block the visitor's path forward over a lead write.
    return { ok: false, error: "Something went wrong — try again." };
  }
}
