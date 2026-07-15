import { z } from "zod";

/** Client-safe: the form renders these; the action validates against them. */
export const SUPPORT_TOPICS = [
  { value: "bug", label: "Something is broken" },
  { value: "billing", label: "Billing or payments" },
  { value: "feature", label: "Feature request" },
  { value: "other", label: "Something else" },
] as const;

export const SupportInput = z.object({
  email: z.email("Enter a valid email so we can reply."),
  topic: z.enum(["bug", "billing", "feature", "other"]),
  message: z
    .string()
    .trim()
    .min(10, "Tell us a little more (at least 10 characters).")
    .max(5_000),
});
export type SupportInput = z.infer<typeof SupportInput>;
