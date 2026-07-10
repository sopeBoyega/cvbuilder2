"use client";

import { useMemo, useState } from "react";
import { Check, CheckCircle2, SquarePen } from "lucide-react";

import { TemplatePreview } from "@/components/templates/template-preview";
import {
  TEMPLATE_STYLES,
  isTemplateUsable,
  type ResumeTemplate,
  type TemplateStyle,
} from "@/lib/documents/templates";
import { cn } from "@/lib/utils";

export function TemplateGallery({
  templates,
}: {
  templates: readonly ResumeTemplate[];
}) {
  const [styles, setStyles] = useState<Set<TemplateStyle>>(new Set());

  const visible = useMemo(
    () =>
      styles.size === 0
        ? templates
        : templates.filter((template) => styles.has(template.style)),
    [templates, styles],
  );

  function toggleStyle(style: TemplateStyle) {
    setStyles((current) => {
      const next = new Set(current);
      if (next.has(style)) next.delete(style);
      else next.add(style);
      return next;
    });
  }

  return (
    <div className="flex flex-col items-start gap-10 md:flex-row">
      {/* Filter rail */}
      <aside className="w-full space-y-4 md:sticky md:top-20 md:w-56">
        <h2 className="text-xs font-medium uppercase tracking-widest text-primary/70">
          Style
        </h2>
        <div className="space-y-3">
          {TEMPLATE_STYLES.map((style) => {
            const checked = styles.has(style);
            return (
              <label
                key={style}
                className="group flex cursor-pointer items-center gap-4"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleStyle(style)}
                  className="sr-only"
                />
                <span
                  className={cn(
                    "flex size-5 items-center justify-center rounded border transition-colors",
                    checked
                      ? "border-primary bg-primary text-on-primary"
                      : "border-[var(--border-strong)] group-hover:border-primary",
                  )}
                >
                  {checked ? <Check className="size-3.5" /> : null}
                </span>
                <span
                  className={cn(
                    "text-sm capitalize transition-colors",
                    checked
                      ? "text-primary"
                      : "text-on-surface group-hover:text-primary",
                  )}
                >
                  {style}
                </span>
              </label>
            );
          })}
        </div>
      </aside>

      {/* Grid */}
      <div className="grid flex-1 grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((template) => (
          <TemplateCard key={template.id} template={template} />
        ))}
      </div>
    </div>
  );
}

function TemplateCard({ template }: { template: ResumeTemplate }) {
  const usable = isTemplateUsable(template);

  return (
    <div className="group relative overflow-hidden rounded-xl border border-[var(--border-strong)] bg-surface transition-all duration-300 hover:border-primary/50">
      {template.atsSafe ? (
        <div className="absolute left-4 top-4 z-20 flex items-center gap-2 rounded-full bg-primary/90 px-3 py-1 backdrop-blur-md">
          <CheckCircle2 className="size-3.5 text-on-primary" />
          <span className="text-xs font-medium uppercase tracking-wider text-on-primary">
            ATS-Safe
          </span>
        </div>
      ) : null}

      <TemplatePreview style={template.style} />

      <div className="p-6">
        <h3 className="text-lg font-semibold text-on-surface">
          {template.name}
        </h3>
        <p className="mt-1 text-xs leading-5 text-on-surface-variant">
          {template.description}
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            disabled={!usable}
            title={usable ? undefined : "The PDF renderer for this template isn't built yet"}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-coral-hi/30 bg-coral-hi/10 py-3 text-base font-semibold text-coral-hi transition-all hover:bg-coral-hi hover:text-[#601401] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-coral-hi/10 disabled:hover:text-coral-hi"
          >
            <SquarePen className="size-4" />
            Customize
          </button>
          <button
            type="button"
            disabled={!usable}
            title={usable ? undefined : "The PDF renderer for this template isn't built yet"}
            className="w-full rounded-lg border border-primary/30 bg-primary/10 py-3 text-base font-semibold text-primary transition-all hover:bg-primary hover:text-on-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-primary/10 disabled:hover:text-primary"
          >
            Use template
          </button>
        </div>

        {!usable ? (
          <p className="mt-3 text-center text-[11px] uppercase tracking-wider text-on-surface-variant">
            Preview only — renderer coming in Phase 1
          </p>
        ) : null}
      </div>
    </div>
  );
}
