"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, GripVertical, MessagesSquare, Trash2 } from "lucide-react";

import { ScoreRing } from "@/components/score-ring";
import { useKanban, type KanbanCard } from "@/lib/stores/kanban";
import {
  APPLICATION_STATUSES,
  APPLICATION_STATUS_META,
  type ApplicationStatus,
} from "@/lib/validation/application";
import { cn } from "@/lib/utils";

export function KanbanBoard({ initial }: { initial: KanbanCard[] }) {
  const cards = useKanban((state) => state.cards);
  const hydrate = useKanban((state) => state.hydrate);
  const move = useKanban((state) => state.move);

  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<ApplicationStatus | null>(null);

  // Seed the store from the server, and re-seed if the server data changes.
  useEffect(() => {
    hydrate(initial);
  }, [hydrate, initial]);

  function drop(status: ApplicationStatus) {
    if (dragging) void move(dragging, status);
    setDragging(null);
    setOver(null);
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {APPLICATION_STATUSES.map((status) => {
        const meta = APPLICATION_STATUS_META[status];
        const column = cards
          .filter((card) => card.status === status)
          .sort((a, b) => b.updatedAtIso.localeCompare(a.updatedAtIso));

        return (
          <div
            key={status}
            onDragOver={(event) => {
              event.preventDefault();
              setOver(status);
            }}
            onDragLeave={() => setOver((s) => (s === status ? null : s))}
            onDrop={() => drop(status)}
            className={cn(
              "flex w-72 shrink-0 flex-col rounded-xl border bg-surface-container-low p-3 transition-colors",
              over === status && dragging
                ? "border-primary/50 bg-surface-container"
                : "border-border",
            )}
          >
            <div className="mb-3 flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className={cn("size-2 rounded-full", meta.dot)} />
                <h2 className="text-sm font-semibold text-on-surface">
                  {meta.label}
                </h2>
              </div>
              <span className="font-mono text-xs text-on-surface-variant">
                {column.length}
              </span>
            </div>

            <div className="flex flex-1 flex-col gap-3">
              {column.map((card) => (
                <Card
                  key={card.id}
                  card={card}
                  dragging={dragging === card.id}
                  onDragStart={() => setDragging(card.id)}
                  onDragEnd={() => setDragging(null)}
                />
              ))}
              {column.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-xs text-on-surface-variant">
                  Drop cards here
                </p>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Card({
  card,
  dragging,
  onDragStart,
  onDragEnd,
}: {
  card: KanbanCard;
  dragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  const move = useKanban((state) => state.move);
  const destroy = useKanban((state) => state.destroy);

  return (
    <article
      draggable
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      className={cn(
        "group cursor-grab rounded-lg border border-border bg-surface p-4 transition-all hover:border-[var(--border-strong)] active:cursor-grabbing",
        dragging && "opacity-40",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-on-surface">
            {card.jobTitle}
          </h3>
          {card.company ? (
            <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-on-surface-variant">
              <Building2 className="size-3 shrink-0" />
              {card.company}
            </p>
          ) : null}
        </div>
        <GripVertical className="size-4 shrink-0 text-on-surface-variant/40" />
      </div>

      {card.nextAction ? (
        <p className="mt-3 rounded border border-border bg-surface-container-low px-2 py-1 text-xs text-on-surface-variant">
          {card.nextAction}
        </p>
      ) : null}

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ScoreRing score={card.atsScore} size={32} />
          <span className="text-[10px] uppercase tracking-wider text-on-surface-variant">
            ATS
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Link
            href={`/interview-prep/${card.id}`}
            aria-label="Interview prep"
            title="Interview prep"
            className="rounded p-1 text-on-surface-variant transition-colors hover:text-indigo-hi"
          >
            <MessagesSquare className="size-3.5" />
          </Link>
          {/* Keyboard/mobile fallback for the drag interaction. */}
          <select
            aria-label="Move to column"
            value={card.status}
            onChange={(event) =>
              void move(card.id, event.target.value as ApplicationStatus)
            }
            className="cursor-pointer rounded border border-border bg-surface-container-low px-1.5 py-1 text-xs text-on-surface-variant outline-none focus:ring-1 focus:ring-primary/40"
          >
            {APPLICATION_STATUSES.map((status) => (
              <option key={status} value={status}>
                {APPLICATION_STATUS_META[status].label}
              </option>
            ))}
          </select>
          <button
            type="button"
            aria-label="Remove application"
            onClick={() => void destroy(card.id)}
            className="cursor-pointer rounded p-1 text-on-surface-variant opacity-0 transition-all hover:text-destructive group-hover:opacity-100"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
}
