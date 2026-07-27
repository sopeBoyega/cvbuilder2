import { z } from "zod";

export const profileSchemaVersion = 1;

const MAX_TAGS = 8;

const Tag = z.string().trim().min(1).max(48);

/** The list of target roles/industries stored as jsonb on `profiles`. */
export const TagList = z.array(Tag).max(MAX_TAGS);

/** Edit the settings-profile fields the user owns (Clerk owns name/email). */
export const UpdateProfileInput = z.object({
  headline: z.string().trim().max(120),
  targetRoles: TagList,
  targetIndustries: TagList,
});
export type UpdateProfileInput = z.infer<typeof UpdateProfileInput>;
