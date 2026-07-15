import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { ChevronDown } from "lucide-react";

import { SupportForm } from "@/components/support/support-form";
import { AppPageHeader } from "@/components/shell/app-page-header";
import { BRAND } from "@/lib/brand";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";

/* Every answer states only what the product actually does today. */
const FAQS: { question: string; answer: string }[] = [
  {
    question: "How is my match score calculated?",
    answer:
      "It combines four signals: keyword coverage against the job description, semantic similarity (AI), resume structure, and formatting checks. Every score shows its full breakdown with weights, and the same inputs always produce the same deterministic parts. To be clear about what it is: this is our relevance-and-parseability diagnostic, not a number any ATS assigns and not a prediction that you'll get an interview.",
  },
  {
    question: "What does the free plan include?",
    answer:
      "Resume import and editing, the full explainable ATS score, PDF export, the application tracker, and up to 3 tailored resumes per month with a daily allowance of AI operations. Pro removes the caps and adds Word export, cover letters, and interview prep. Current prices are on the pricing page.",
  },
  {
    question: "What happens to my resume data?",
    answer:
      "Your resume text is processed by Google's Gemini API to power parsing, questions, and semantic scoring. That's the only AI provider we use. The free guest checker stores nothing you paste. Saved resumes are yours and can be deleted anytime from the library's card menu.",
  },
  {
    question: "Why did I get 'The AI service is at capacity'?",
    answer:
      "The AI provider occasionally rate-limits requests. Your work isn't lost: wait a minute and retry. Deterministic scoring (keywords, structure, formatting) keeps working during these windows.",
  },
  {
    question: "Does deleting a resume affect my tracked applications?",
    answer:
      "No. Deleting a resume removes it, its versions, and cover letters drafted from it, but application cards stay on your board without the resume attached.",
  },
  {
    question: "My payment went through but Pro isn't active.",
    answer:
      "Activation usually lands within a few seconds of Paystack confirming the charge, and the billing page updates automatically. If it's been more than a few minutes, send us a message below with the email you paid with.",
  },
];

export default async function SupportPage() {
  const { userId } = await auth();
  const [profile] = userId
    ? await db
        .select({ email: profiles.email })
        .from(profiles)
        .where(eq(profiles.clerkUserId, userId))
        .limit(1)
    : [];

  return (
    <div className="mx-auto max-w-3xl space-y-10 p-4 md:p-8">
      <AppPageHeader
        title="Support"
        description="Stuck, billed wrong, or missing a feature? We're a small team and we read everything."
      />

      <SupportForm initialEmail={profile?.email ?? ""} />

      <section>
        <h2 className="font-heading text-xl font-semibold text-on-surface">
          Frequently asked
        </h2>
        <div className="mt-4 space-y-2">
          {FAQS.map((faq) => (
            <details
              key={faq.question}
              className="group rounded-xl border border-border bg-surface"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 text-sm font-semibold text-on-surface [&::-webkit-details-marker]:hidden">
                {faq.question}
                <ChevronDown className="size-4 shrink-0 text-on-surface-variant transition-transform group-open:rotate-180" />
              </summary>
              <p className="px-5 pb-4 text-sm leading-6 text-on-surface-variant">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </section>

      <p className="text-center text-xs text-on-surface-variant">
        Prefer email? Write to{" "}
        <a
          href={`mailto:${BRAND.contactEmail}`}
          className="text-primary underline underline-offset-2"
        >
          {BRAND.contactEmail}
        </a>
        .
      </p>
    </div>
  );
}
