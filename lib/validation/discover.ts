import { z } from "zod";

/** One ranked listing as the Discover feed UI renders it. Server → client shape. */
export const DiscoverListingView = z.object({
  id: z.uuid(),
  title: z.string(),
  company: z.string().nullable(),
  location: z.string().nullable(),
  remote: z.boolean(),
  description: z.string(),
  url: z.string(),
  salary: z.string().nullable(),
  postedLabel: z.string().nullable(),
  /** 0-100, cosine similarity to the user's base resume + a small role boost. */
  matchScore: z.number().int().min(0).max(100),
  /** True if the title matches one of the profile's target roles. */
  matchesTargetRole: z.boolean(),
});
export type DiscoverListingView = z.infer<typeof DiscoverListingView>;
