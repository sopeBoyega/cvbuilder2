"use client";

import { useState } from "react";
import { Braces, FileText } from "lucide-react";

import type { ExtractedGroup } from "@/lib/ats/extraction";
import { cn } from "@/lib/utils";

/**
 * The "what the parser extracted" panel — the literal answer to "how does a
 * machine read my resume?".
 *
 * Toggles between the structured fields and the raw text they were pulled
 * from, because seeing both side by side is what makes a dropped section
 * obvious. Absent fields render as a red `null` rather than being hidden.
 */
export function ParsePreview({
  groups,
  rawText,
}: {
  groups: ExtractedGroup[];
  rawText: string | null;
}) {
  const [view, setView] = useState<"structured" | "raw">("structured");

  return (
    <section className="rounded-xl border border-border bg-surface">
      <header className="flex items-center justify-between gap-4 border-b border-border p-4">
        <h2 className="flex items-center gap-2 font-heading text-lg font-semibold text-on-surface">
          <Braces className="size-5 text-primary" />
          Extracted data
        </h2>
        <div className="flex rounded-lg border border-border bg-surface-container-low p-0.5">
          <ToggleButton
            active={view === "structured"}
            onClick={() => setView("structured")}
          >
            Parsed structure
          </ToggleButton>
          <ToggleButton
            active={view === "raw"}
            onClick={() => setView("raw")}
            disabled={rawText === null}
            title={
              rawText === null
                ? "No source text stored for this version"
                : undefined
            }
          >
            Source text
          </ToggleButton>
        </div>
      </header>

      {/* overflow-x-hidden: long values must wrap, never scroll the page. */}
      <div className="max-h-[32rem] overflow-y-auto overflow-x-hidden p-4 lg:max-h-[46rem]">
        {view === "structured" ? (
          /*
           * A plain div, not <pre>: `white-space: pre` prevents wrapping, so a
           * long summary or bullet would force horizontal overflow. Indentation
           * comes from padding instead of literal spaces.
           */
          <div className="font-mono text-xs leading-6 text-on-surface-variant">
            {groups.map((group) => (
              <div key={group.name} className="mb-3">
                <span className="text-primary">{group.name}</span>
                <span className="text-on-surface-variant/50"> {"{"}</span>
                {group.fields.map((field) => (
                  <div
                    key={`${group.name}.${field.label}`}
                    className="flex gap-2 pl-4"
                  >
                    <span className="shrink-0 text-indigo-hi">
                      {field.label}
                      <span className="text-on-surface-variant/50">:</span>
                    </span>
                    {field.value === null ? (
                      <span
                        className={cn(
                          "underline decoration-dotted underline-offset-4",
                          field.critical
                            ? "text-destructive"
                            : "text-coral-hi/80",
                        )}
                      >
                        null
                      </span>
                    ) : (
                      <span className="min-w-0 text-on-surface wrap-anywhere">
                        {field.value}
                      </span>
                    )}
                  </div>
                ))}
                <span className="text-on-surface-variant/50">{"}"}</span>
              </div>
            ))}
          </div>
        ) : (
          <pre className="whitespace-pre-wrap font-mono text-xs leading-6 text-on-surface-variant wrap-anywhere">
            {rawText}
          </pre>
        )}
      </div>

      <footer className="flex items-start gap-2 border-t border-border p-4 text-xs leading-5 text-on-surface-variant">
        <FileText className="mt-0.5 size-4 shrink-0" />
        <p>
          This is the structure your resume becomes after parsing. A{" "}
          <span className="text-destructive">null</span> in a critical field is
          what a recruiter&apos;s search would fail to find.
        </p>
      </footer>
    </section>
  );
}

function ToggleButton({
  active,
  onClick,
  disabled,
  title,
  children,
}: {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "rounded-md px-3 py-1.5 font-mono text-xs transition-colors",
        active
          ? "bg-surface-raised font-semibold text-primary"
          : "text-on-surface-variant hover:text-on-surface",
        disabled && "cursor-not-allowed opacity-40 hover:text-on-surface-variant",
        !disabled && !active && "cursor-pointer",
      )}
    >
      {children}
    </button>
  );
}
