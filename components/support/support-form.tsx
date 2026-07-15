"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";

import { submitSupportRequest } from "@/lib/actions/support";
import { SUPPORT_TOPICS } from "@/lib/validation/support";

const FIELD =
  "w-full rounded-lg border border-border bg-surface-container-lowest px-3 py-2 text-sm text-on-surface outline-none transition-all placeholder:text-on-surface-variant/40 focus:border-primary/40 focus:ring-1 focus:ring-primary/40";

export function SupportForm({ initialEmail }: { initialEmail: string }) {
  const [email, setEmail] = useState(initialEmail);
  const [topic, setTopic] = useState<string>("bug");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startPending] = useTransition();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    startPending(async () => {
      const result = await submitSupportRequest({ email, topic, message });
      if (result.ok) {
        setSent(true);
      } else {
        setError(result.error);
      }
    });
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center rounded-xl border border-primary/30 bg-primary/5 p-8 text-center">
        <CheckCircle2 className="mb-3 size-8 text-primary" />
        <h2 className="font-heading text-xl font-semibold text-on-surface">
          Message received
        </h2>
        <p className="mt-2 max-w-sm text-sm leading-6 text-on-surface-variant">
          We read everything and reply to {email}. Small team, honest answers,
          usually within a day or two.
        </p>
        <button
          type="button"
          onClick={() => {
            setSent(false);
            setMessage("");
          }}
          className="mt-6 rounded-lg border border-border px-4 py-2 text-sm text-on-surface-variant transition-colors hover:border-primary hover:text-primary"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-4 rounded-xl border border-border bg-surface p-6"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="support-email"
            className="mb-1 block text-xs font-medium uppercase tracking-wider text-on-surface-variant"
          >
            Your email
          </label>
          <input
            id="support-email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@email.com"
            className={FIELD}
          />
        </div>
        <div>
          <label
            htmlFor="support-topic"
            className="mb-1 block text-xs font-medium uppercase tracking-wider text-on-surface-variant"
          >
            Topic
          </label>
          <select
            id="support-topic"
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            className={FIELD}
          >
            {SUPPORT_TOPICS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label
          htmlFor="support-message"
          className="mb-1 block text-xs font-medium uppercase tracking-wider text-on-surface-variant"
        >
          What&apos;s going on?
        </label>
        <textarea
          id="support-message"
          required
          rows={6}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          maxLength={5_000}
          placeholder="The more detail, the faster we can help: what you did, what you expected, what happened instead."
          className={`${FIELD} resize-y`}
        />
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 font-semibold text-on-primary transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
          Send message
        </button>
      </div>
    </form>
  );
}
