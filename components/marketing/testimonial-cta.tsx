"use client";

import { useState, useTransition } from "react";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";

import { submitSupportRequest } from "@/lib/actions/support";
import { track } from "@/lib/analytics";

/*
 * The proof section's "tell us your jump" flow. Replaces the old mailto:
 * link, which silently did nothing on devices without a configured mail
 * client. Submissions land in `support_requests` (topic "testimonial") and
 * relay to the contact inbox when Resend is configured.
 */
export function TestimonialCta() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startPending] = useTransition();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    startPending(async () => {
      const result = await submitSupportRequest({
        email,
        topic: "testimonial",
        message,
      });
      if (result.ok) {
        track("cta_clicked", {
          cta: "testimonial_submitted",
          location: "landing_proof",
        });
        setDone(true);
      } else {
        setError(result.error);
      }
    });
  }

  if (done) {
    return (
      <p className="mt-6 flex items-center justify-center gap-2 text-sm text-[#5BC06B]">
        <CheckCircle2 className="size-4" />
        Thank you. We&apos;ll reply before publishing anything.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          track("cta_clicked", {
            cta: "share_score_jump",
            location: "landing_proof",
          });
          setOpen(true);
        }}
        className="mt-6 inline-flex items-center gap-2 rounded-lg border border-[#242C3D] bg-[#161C2A] px-5 py-2.5 text-sm font-semibold text-[#E6E8EB] transition-all hover:border-[#5BC06B] hover:text-[#5BC06B]"
      >
        Used CVBuilder? Tell us your jump
        <ArrowRight className="size-4" />
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="mx-auto mt-6 max-w-md space-y-3 text-left">
      <input
        type="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="you@email.com"
        aria-label="Your email"
        className="w-full rounded-lg border border-[#242C3D] bg-[#10131A] px-3 py-2 text-sm text-white outline-none transition-all placeholder:text-[#9BA1A6]/60 focus:border-[#5BC06B] focus:ring-1 focus:ring-[#5BC06B]"
      />
      <textarea
        required
        rows={4}
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        maxLength={5_000}
        placeholder="e.g. Match score went 54 to 89 for a junior frontend role, and I got the phone screen. Happy to be quoted."
        aria-label="Your story"
        className="w-full resize-y rounded-lg border border-[#242C3D] bg-[#10131A] px-3 py-2 text-sm text-white outline-none transition-all placeholder:text-[#9BA1A6]/60 focus:border-[#5BC06B] focus:ring-1 focus:ring-[#5BC06B]"
      />
      {error ? <p className="text-xs text-[#FF8A6B]">{error}</p> : null}
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg px-4 py-2 text-sm text-[#9BA1A6] transition-colors hover:text-white"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-lg bg-[#5BC06B] px-5 py-2 text-sm font-semibold text-[#0D1017] transition-colors hover:bg-[#82E78C] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : null}
          Send story
        </button>
      </div>
      <p className="text-center text-xs text-[#9BA1A6]">
        We only publish with your permission, unedited.
      </p>
    </form>
  );
}
