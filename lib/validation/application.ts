import { z } from "zod";

export const applicationSchemaVersion = 1;

/**
 * Kanban columns, in board order. Stored as text on `applications.status` and
 * validated here (same pattern as `resume_versions.source`), so adding a column
 * never needs a pg-enum migration.
 */
export const APPLICATION_STATUSES = [
  "saved",
  "applied",
  "interviewing",
  "offer",
  "rejected",
] as const;

export const ApplicationStatus = z.enum(APPLICATION_STATUSES);
export type ApplicationStatus = z.infer<typeof ApplicationStatus>;

export function isApplicationStatus(value: string): value is ApplicationStatus {
  return (APPLICATION_STATUSES as readonly string[]).includes(value);
}

export const APPLICATION_STATUS_META: Record<
  ApplicationStatus,
  { label: string; accent: string; dot: string }
> = {
  saved: {
    label: "Saved",
    accent: "text-on-surface-variant",
    dot: "bg-on-surface-variant/50",
  },
  applied: { label: "Applied", accent: "text-blue", dot: "bg-blue" },
  interviewing: {
    label: "Interviewing",
    accent: "text-indigo-hi",
    dot: "bg-indigo-hi",
  },
  offer: { label: "Offer", accent: "text-primary", dot: "bg-primary" },
  rejected: {
    label: "Rejected",
    accent: "text-on-surface-variant",
    dot: "bg-destructive/60",
  },
};

/** Create an application straight from the tailoring wizard's finalize step. */
export const CreateApplicationInput = z.object({
  jobId: z.uuid(),
  resumeVersionId: z.uuid().optional(),
});
export type CreateApplicationInput = z.infer<typeof CreateApplicationInput>;

/**
 * Move a card to a new column. Intra-column ordering is by recency for now
 * (a moved card jumps to the top of its new column via `updated_at`); the
 * `position` column is reserved for manual reordering later.
 */
export const MoveApplicationInput = z.object({
  applicationId: z.uuid(),
  status: ApplicationStatus,
});
export type MoveApplicationInput = z.infer<typeof MoveApplicationInput>;

/** Edit the free-text next-action note on a card. */
export const UpdateNextActionInput = z.object({
  applicationId: z.uuid(),
  nextAction: z.string().trim().max(280),
});
export type UpdateNextActionInput = z.infer<typeof UpdateNextActionInput>;
