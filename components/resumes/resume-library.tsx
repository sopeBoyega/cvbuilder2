"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  FileText,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";

import { ScoreRing } from "@/components/score-ring";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { Pager } from "@/components/ui/pager";
import { deleteResume, renameResume } from "@/lib/actions/resume";
import { cn } from "@/lib/utils";

export type VariantView = {
  id: string;
  jobLabel: string;
  subtitle: string | null;
  atsScore: number | null;
};

export type ResumeGroup = {
  id: string;
  title: string;
  isBase: boolean;
  /** Display name of the export template this resume uses. */
  templateName: string;
  updatedAtIso: string;
  updatedLabel: string;
  atsScore: number | null;
  tags: string[];
  variants: VariantView[];
};

type SortKey = "recent" | "name" | "score";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "recent", label: "Recent" },
  { key: "name", label: "Name" },
  { key: "score", label: "Score" },
];

/** Cycles the accent used for each nested variant, matching the design. */
const VARIANT_ACCENTS = [
  { bar: "bg-coral-hi", icon: "text-coral-hi", hover: "hover:border-coral-hi/50" },
  { bar: "bg-indigo-hi", icon: "text-indigo-hi", hover: "hover:border-indigo-hi/50" },
  { bar: "bg-primary", icon: "text-primary", hover: "hover:border-primary/50" },
] as const;

const GLASS = "border border-border bg-[rgba(22,28,42,0.8)] backdrop-blur-[8px]";

/** 2 columns × 3 rows per page at the grid's default width. */
const PAGE_SIZE = 6;

/** Deterministic cover gradient derived from the resume id (no stock photos). */
function coverGradient(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  const hue = Math.abs(hash) % 360;
  return `linear-gradient(140deg, hsl(${hue} 45% 22%), hsl(${(hue + 48) % 360} 40% 12%))`;
}

export function ResumeLibrary({ groups }: { groups: ResumeGroup[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("recent");
  const [page, setPage] = useState(1);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = needle
      ? groups.filter(
          (group) =>
            group.title.toLowerCase().includes(needle) ||
            group.tags.some((tag) => tag.toLowerCase().includes(needle)) ||
            group.variants.some((v) =>
              v.jobLabel.toLowerCase().includes(needle),
            ),
        )
      : groups;

    return [...filtered].sort((a, b) => {
      if (sort === "name") return a.title.localeCompare(b.title);
      if (sort === "score") return (b.atsScore ?? -1) - (a.atsScore ?? -1);
      return b.updatedAtIso.localeCompare(a.updatedAtIso);
    });
  }, [groups, query, sort]);

  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  // Clamp rather than reset via effect: a delete or a shrinking filter can
  // leave `page` past the new last page without either changing on its own.
  const safePage = Math.min(page, totalPages);
  const pageItems = visible.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  // First visit: no filter bar over an empty grid — one clear starting point.
  if (groups.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="Your library is empty"
        description="Base resumes and their AI-tailored variants will be organized here, each with its ATS score."
      >
        <Link
          href="/onboarding"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-semibold text-on-primary transition-all hover:brightness-110"
        >
          <Plus className="size-4" />
          Create your first resume
        </Link>
      </EmptyState>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter bar */}
      <div
        className={cn(
          "flex flex-wrap items-center gap-4 rounded-xl border border-border bg-surface p-3",
        )}
      >
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="Search resumes…"
            aria-label="Search resumes"
            className="w-full rounded-lg border border-border bg-surface-container-low py-1.5 pl-9 pr-3 text-sm text-on-surface outline-none transition-all placeholder:text-on-surface-variant/50 focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-[0.06em] text-on-surface-variant">
            Sort by
          </span>
          {SORTS.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => {
                setSort(option.key);
                setPage(1);
              }}
              aria-pressed={sort === option.key}
              className={cn(
                "cursor-pointer rounded-lg border px-3 py-1.5 text-sm transition-all",
                sort === option.key
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border bg-surface-container-low text-on-surface-variant hover:border-primary",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid — paginated; the "create new" tile stays available on every page. */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {pageItems.map((group) => (
          <ResumeGroupCard key={group.id} group={group} />
        ))}

        <Link
          href="/onboarding"
          className="group flex min-h-56 cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-[var(--border-strong)] p-10 text-center transition-all hover:bg-surface-container-low"
        >
          <div className="flex size-12 items-center justify-center rounded-full border border-[var(--border-strong)] text-on-surface-variant transition-all group-hover:border-primary group-hover:text-primary">
            <Plus className="size-5" />
          </div>
          <div>
            <p className="text-lg font-semibold text-on-surface">
              New Professional Base
            </p>
            <p className="mt-1 text-xs text-on-surface-variant">
              Start from scratch or upload an existing PDF.
            </p>
          </div>
        </Link>
      </div>

      <Pager page={safePage} totalPages={totalPages} onChange={setPage} />

      {groups.length > 0 && visible.length === 0 ? (
        <p className="py-8 text-center text-sm text-on-surface-variant">
          No resumes match “{query}”.
        </p>
      ) : null}
    </div>
  );
}

/** The card's three-dot menu: rename (dialog) and delete (confirm dialog). */
function ResumeCardMenu({ group }: { group: ResumeGroup }) {
  const router = useRouter();
  const [dialog, setDialog] = useState<"rename" | "delete" | null>(null);
  const [title, setTitle] = useState(group.title);
  const [error, setError] = useState<string | null>(null);
  const [pending, startPending] = useTransition();

  function close() {
    setDialog(null);
    setError(null);
  }

  function submitRename(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    startPending(async () => {
      const result = await renameResume({ resumeId: group.id, title });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      close();
      router.refresh();
    });
  }

  function confirmDelete() {
    setError(null);
    startPending(async () => {
      const result = await deleteResume({ resumeId: group.id });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      close();
      router.refresh();
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`Options for ${group.title}`}
          className="cursor-pointer rounded p-1 text-on-surface-variant transition-colors hover:bg-surface-container-highest"
        >
          <MoreVertical className="size-5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => {
              setTitle(group.title);
              setDialog("rename");
            }}
          >
            <Pencil className="size-4" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setDialog("delete")}
          >
            <Trash2 className="size-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Rename */}
      <Dialog open={dialog === "rename"} onOpenChange={(open) => !open && close()}>
        <DialogContent>
          <form onSubmit={submitRename}>
            <DialogHeader>
              <DialogTitle>Rename resume</DialogTitle>
              <DialogDescription>
                This is the name shown across your library, exports keep their
                own filenames.
              </DialogDescription>
            </DialogHeader>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={120}
              autoFocus
              aria-label="Resume name"
              className="my-4 w-full rounded-lg border border-border bg-surface-container-lowest px-3 py-2 text-sm text-on-surface outline-none transition-all focus:border-primary/40 focus:ring-1 focus:ring-primary/40"
            />
            {error ? (
              <p role="alert" className="mb-3 text-xs text-destructive">
                {error}
              </p>
            ) : null}
            <DialogFooter>
              <button
                type="button"
                onClick={close}
                className="rounded-lg px-4 py-2 text-sm text-on-surface-variant transition-colors hover:text-on-surface"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={pending || !title.trim()}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {pending ? <Loader2 className="size-4 animate-spin" /> : null}
                Save name
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={dialog === "delete"} onOpenChange={(open) => !open && close()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete “{group.title}”?</DialogTitle>
            <DialogDescription>
              This permanently removes the resume, its{" "}
              {group.variants.length > 0
                ? `${group.variants.length} tailored ${group.variants.length === 1 ? "variant" : "variants"}, `
                : ""}
              version history, and any cover letters drafted from it. Tracked
              applications stay on the board without the resume attached. This
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {error ? (
            <p role="alert" className="mt-2 text-xs text-destructive">
              {error}
            </p>
          ) : null}
          <DialogFooter>
            <button
              type="button"
              onClick={close}
              className="rounded-lg px-4 py-2 text-sm text-on-surface-variant transition-colors hover:text-on-surface"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              disabled={pending}
              className="inline-flex items-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              Delete resume
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ResumeGroupCard({ group }: { group: ResumeGroup }) {
  return (
    <div className="flex flex-col gap-1">
      {/* Base resume card */}
      <div
        className={cn(
          "group overflow-hidden rounded-xl transition-all hover:border-primary/50",
          GLASS,
        )}
      >
        <div className="flex h-full flex-col sm:flex-row">
          <div
            className="relative h-24 w-full overflow-hidden sm:h-auto sm:w-32"
            style={{ backgroundImage: coverGradient(group.id) }}
          >
            <div className="absolute inset-0 flex items-center justify-center text-on-surface-variant/30">
              <FileText className="size-8" />
            </div>
            <div className="absolute inset-0 bg-linear-to-t from-surface to-transparent" />
          </div>

          <div className="flex flex-1 flex-col justify-between p-6">
            <div className="mb-3 flex items-start justify-between">
              <div>
                <Link
                  href={`/resumes/${group.id}`}
                  className="text-lg font-semibold text-on-surface transition-colors hover:text-primary"
                >
                  {group.title}
                </Link>
                <p className="text-xs uppercase tracking-wider text-on-surface-variant">
                  {group.isBase ? group.templateName : "Variant"}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <ScoreRing score={group.atsScore} size={48} />
                <ResumeCardMenu group={group} />
              </div>
            </div>

            {group.tags.length > 0 ? (
              <div className="mb-4 flex flex-wrap gap-2">
                {group.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded border border-primary/20 bg-primary/10 px-2 py-0.5 font-mono text-xs text-primary"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="mt-auto flex items-center justify-between">
              <span className="text-xs text-on-surface-variant">
                Edited {group.updatedLabel}
              </span>
              {group.variants.length > 0 ? (
                <span className="text-xs text-on-surface-variant">
                  +{group.variants.length} variant
                  {group.variants.length === 1 ? "" : "s"}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Nested tailored variants */}
      {group.variants.length > 0 ? (
        <div className="relative ml-12">
          <div
            className="absolute -left-6 bottom-6 top-0 w-px"
            style={{
              background:
                "linear-gradient(to bottom, transparent, #242C3D, transparent)",
            }}
          />
          <div className="space-y-1">
            {group.variants.map((variant, index) => {
              const accent = VARIANT_ACCENTS[index % VARIANT_ACCENTS.length];
              return (
                <Link
                  key={variant.id}
                  href={`/resumes/${group.id}`}
                  className={cn(
                    "group flex cursor-pointer items-center gap-4 rounded-lg p-4 transition-all",
                    GLASS,
                    accent.hover,
                  )}
                >
                  <div
                    className={cn("h-8 w-1 rounded-full opacity-40 transition-opacity group-hover:opacity-100", accent.bar)}
                  />
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <Sparkles className={cn("size-4", accent.icon)} />
                      <p className="text-base font-semibold text-on-surface">
                        Tailored for {variant.jobLabel}
                      </p>
                    </div>
                    {variant.subtitle ? (
                      <p className="text-xs text-on-surface-variant">
                        {variant.subtitle}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-mono text-xs text-on-surface">
                        {variant.atsScore === null
                          ? "Not scored"
                          : `${variant.atsScore}% Match`}
                      </p>
                      <p className="text-[10px] uppercase text-on-surface-variant">
                        ATS Score
                      </p>
                    </div>
                    <ChevronRight className="size-5 text-on-surface-variant transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
