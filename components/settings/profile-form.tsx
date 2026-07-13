"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, Plus, Save, Target, UserRound, X } from "lucide-react";

import { updateProfile } from "@/lib/actions/profile";
import { cn } from "@/lib/utils";

/*
 * Adapted from the "Settings / Profile" design: personal info + professional
 * targeting (role/industry chips). Name and email render read-only — Clerk
 * owns them (the design showed them editable; that would silently desync).
 */

const MAX_TAGS = 8;

export function ProfileForm({
  name,
  email,
  initialHeadline,
  initialRoles,
  initialIndustries,
}: {
  name: string | null;
  email: string;
  initialHeadline: string;
  initialRoles: string[];
  initialIndustries: string[];
}) {
  const [headline, setHeadline] = useState(initialHeadline);
  const [roles, setRoles] = useState(initialRoles);
  const [industries, setIndustries] = useState(initialIndustries);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, startSaving] = useTransition();

  function save() {
    setError(null);
    startSaving(async () => {
      const result = await updateProfile({
        headline,
        targetRoles: roles,
        targetIndustries: industries,
      });
      if (result.ok) setSaved(true);
      else setError(result.error);
    });
  }

  function markDirty() {
    setSaved(false);
  }

  return (
    <div className="space-y-6">
      {/* Personal information */}
      <section className="rounded-xl border border-border bg-surface p-6">
        <h2 className="flex items-center gap-3 text-lg font-semibold text-on-surface">
          <span className="flex size-8 items-center justify-center rounded-lg border border-border bg-surface-container-high">
            <UserRound className="size-4 text-primary" />
          </span>
          Personal information
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-on-surface-variant">
              Full name
            </p>
            <p className="rounded-lg border border-border bg-surface-container-low px-3 py-2 text-sm text-on-surface">
              {name ?? "Not set"}
            </p>
          </div>
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-on-surface-variant">
              Email address
            </p>
            <p className="truncate rounded-lg border border-border bg-surface-container-low px-3 py-2 text-sm text-on-surface">
              {email}
            </p>
          </div>
        </div>
        <p className="mt-2 text-xs text-on-surface-variant">
          Name and email come from your sign-in account; change them from the
          account menu.
        </p>
        <div className="mt-4">
          <label
            htmlFor="headline"
            className="mb-1 block text-xs font-medium uppercase tracking-wider text-on-surface-variant"
          >
            Professional headline
          </label>
          <input
            id="headline"
            value={headline}
            maxLength={120}
            onChange={(event) => {
              setHeadline(event.target.value);
              markDirty();
            }}
            placeholder="e.g. Frontend engineer · React, TypeScript, Node"
            className="w-full rounded-lg border border-border bg-surface-container-lowest px-3 py-2 text-sm text-on-surface outline-none transition-all placeholder:text-on-surface-variant/40 focus:border-primary/40 focus:ring-1 focus:ring-primary/40"
          />
        </div>
      </section>

      {/* Professional targeting */}
      <section className="rounded-xl border border-border bg-surface p-6">
        <h2 className="flex items-center gap-3 text-lg font-semibold text-on-surface">
          <span className="flex size-8 items-center justify-center rounded-lg border border-border bg-surface-container-high">
            <Target className="size-4 text-indigo-hi" />
          </span>
          Professional targeting
        </h2>
        <p className="mt-2 text-sm text-on-surface-variant">
          The roles and industries you&apos;re aiming for. These will inform
          AI suggestions as targeting-aware features ship.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <TagEditor
            label="Target roles"
            placeholder="Add a role…"
            tags={roles}
            accent="indigo"
            onChange={(next) => {
              setRoles(next);
              markDirty();
            }}
          />
          <TagEditor
            label="Target industries"
            placeholder="Add an industry…"
            tags={industries}
            accent="primary"
            onChange={(next) => {
              setIndustries(next);
              markDirty();
            }}
          />
        </div>
      </section>

      <div className="flex items-center justify-end gap-4">
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 font-semibold text-on-primary transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : saved ? (
            <Check className="size-4" />
          ) : (
            <Save className="size-4" />
          )}
          {saved ? "Saved" : "Save changes"}
        </button>
      </div>
    </div>
  );
}

function TagEditor({
  label,
  placeholder,
  tags,
  accent,
  onChange,
}: {
  label: string;
  placeholder: string;
  tags: string[];
  accent: "indigo" | "primary";
  onChange: (tags: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  const chipClass =
    accent === "indigo"
      ? "border-indigo-hi/30 bg-indigo-hi/10 text-indigo-hi"
      : "border-primary/30 bg-primary/10 text-primary";

  function add() {
    const value = draft.trim();
    if (!value || tags.length >= MAX_TAGS) return;
    if (tags.some((tag) => tag.toLowerCase() === value.toLowerCase())) {
      setDraft("");
      return;
    }
    onChange([...tags, value]);
    setDraft("");
  }

  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-on-surface-variant">
        {label}
      </p>
      {tags.length > 0 ? (
        <div className="mb-3 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-xs",
                chipClass,
              )}
            >
              {tag}
              <button
                type="button"
                aria-label={`Remove ${tag}`}
                onClick={() => onChange(tags.filter((item) => item !== tag))}
                className="transition-opacity hover:opacity-70"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      ) : null}
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          disabled={tags.length >= MAX_TAGS}
          aria-label={label}
          className="flex-1 rounded-lg border border-border bg-surface-container-lowest px-3 py-2 text-sm text-on-surface outline-none transition-all placeholder:text-on-surface-variant/40 focus:border-primary/40 focus:ring-1 focus:ring-primary/40 disabled:opacity-50"
        />
        <button
          type="button"
          onClick={add}
          disabled={!draft.trim() || tags.length >= MAX_TAGS}
          aria-label={`Add to ${label.toLowerCase()}`}
          className="flex size-9 items-center justify-center rounded-lg border border-border bg-surface-container-low text-on-surface-variant transition-all hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus className="size-4" />
        </button>
      </div>
      {tags.length >= MAX_TAGS ? (
        <p className="mt-1 text-xs text-on-surface-variant">
          Limit of {MAX_TAGS} reached. Remove one to add another.
        </p>
      ) : null}
    </div>
  );
}
