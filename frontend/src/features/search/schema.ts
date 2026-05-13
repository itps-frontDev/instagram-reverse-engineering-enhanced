import { z } from "zod";

export const searchTypeSchema = z.enum(["account", "hashtag", "luoghi"]);

export const searchInputSchema = z.object({
  q: z.string().trim().min(1),
  type: searchTypeSchema.default("account"),
  limit: z.number().int().min(1).max(50).default(20),
});

const searchAccountResultBackendSchema = z.object({
  uuid: z.string().uuid(),
  username: z.string().trim().min(1),
  fullName: z.string().trim().nullable(),
  profileImageUrl: z.string().trim().nullable(),
  isVerified: z.boolean().optional(),
  verified: z.boolean().optional(),
  isPrivate: z.boolean().optional(),
  privateProfile: z.boolean().optional(),
  followersCount: z.number().int().nonnegative(),
  isFollowing: z.boolean().optional(),
  following: z.boolean().optional(),
});

export const searchAccountResultSchema = searchAccountResultBackendSchema.transform((value) => ({
  uuid: value.uuid,
  username: value.username,
  fullName: value.fullName,
  profileImageUrl: value.profileImageUrl,
  isVerified: value.isVerified ?? value.verified ?? false,
  isPrivate: value.isPrivate ?? value.privateProfile ?? false,
  followersCount: value.followersCount,
  isFollowing: value.isFollowing ?? value.following ?? false,
}));

export const searchDataSchema = z.object({
  results: z.array(searchAccountResultSchema),
});

const searchBackendSuccessSchema = z.object({
  success: z.literal(true),
  data: searchDataSchema,
  message: z.string().trim().optional(),
});

const searchBackendErrorSchema = z.object({
  success: z.literal(false),
  error: z.string().trim().min(1),
  message: z.string().trim().min(1),
});

export const searchBackendResponseSchema = z.union([searchBackendSuccessSchema, searchBackendErrorSchema]);

export type SearchActionResult<T> = { success: true; data: T } | { success: false; error: string };
export type SearchInput = z.infer<typeof searchInputSchema>;
export type SearchData = z.infer<typeof searchDataSchema>;
export type SearchAccountResult = z.infer<typeof searchAccountResultSchema>;
