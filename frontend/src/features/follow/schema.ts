import { z } from 'zod';

// ─── Shared ──────────────────────────────────────────────────────────────────

export const followerDataSchema = z.object({
  id: z.number().int().positive(),
  username: z.string().min(1),
  fullName: z.string().nullable().optional(),
  profileImageUrl: z.string().nullable().optional(),
  followStatus: z.enum(['none', 'pending', 'accepted']),
});

const apiErrorResponseSchema = z.object({
  success: z.literal(false),
  data: z.never().optional(),
  message: z.string().optional(),
  error: z.string(),
});

// ─── getFollowStatus ─────────────────────────────────────────────────────────

export const getFollowStatusInputSchema = z.object({
  username: z.string().min(1, 'Username is required'),
});

export const followStatusDataSchema = z.object({
  status: z.enum(['self', 'none', 'pending', 'accepted']),
});

export const followStatusResponseSchema = z.union([
  z.object({
    success: z.literal(true),
    data: followStatusDataSchema,
    message: z.string().optional(),
    error: z.null().optional(),
  }),
  apiErrorResponseSchema,
]);

export const getFollowStatusResultSchema = z.object({
  success: z.boolean(),
  data: followStatusDataSchema.optional(),
  error: z.string().optional(),
});

// ─── getFollowers ─────────────────────────────────────────────────────────────

export const getFollowersInputSchema = z.object({
  username: z.string().min(1, 'Username is required'),
});

export const followersResponseSchema = z.union([
  z.object({
    success: z.literal(true),
    data: z.array(followerDataSchema),
    message: z.string().optional(),
    error: z.null().optional(),
  }),
  apiErrorResponseSchema,
]);

export const getFollowersResultSchema = z.object({
  success: z.boolean(),
  data: z
    .object({
      followers: z.array(
        z.object({
          id: z.number().int().positive(),
          username: z.string(),
          full_name: z.string().nullable(),
          profile_image_url: z.string().nullable(),
          follow_status: z.enum(['none', 'pending', 'accepted']),
          is_following: z.boolean(),
          isPending: z.boolean(),
          is_verified: z.boolean(),
          follows_you: z.boolean(),
        })
      ),
    })
    .optional(),
  error: z.string().optional(),
});

// ─── getFollowing ─────────────────────────────────────────────────────────────

export const getFollowingInputSchema = z.object({
  username: z.string().min(1, 'Username is required'),
});

export const followingResponseSchema = z.union([
  z.object({
    success: z.literal(true),
    data: z.array(followerDataSchema),
    message: z.string().optional(),
    error: z.null().optional(),
  }),
  apiErrorResponseSchema,
]);

export const getFollowingResultSchema = z.object({
  success: z.boolean(),
  data: z
    .array(
      z.object({
        id: z.number().int().positive(),
        username: z.string(),
        fullName: z.string().nullable(),
        profileImageUrl: z.string().nullable(),
        followStatus: z.enum(['none', 'pending', 'accepted']),
      })
    )
    .optional(),
  error: z.string().optional(),
});

// ─── toggleFollow ─────────────────────────────────────────────────────────────

export const toggleFollowInputSchema = z.object({
  targetProfileId: z.coerce.number().int().positive(),
});

export const toggleFollowDataSchema = z.object({
  action: z.enum(['created', 'requested', 'removed']),
  status: z.enum(['none', 'pending', 'accepted']),
});

export const toggleFollowResponseSchema = z.union([
  z.object({
    success: z.literal(true),
    data: toggleFollowDataSchema,
    message: z.string().optional(),
    error: z.null().optional(),
  }),
  apiErrorResponseSchema,
]);

export const toggleFollowResultSchema = z.object({
  success: z.boolean(),
  data: toggleFollowDataSchema.optional(),
  error: z.string().optional(),
});

// ─── acceptFollowRequest / rejectFollowRequest / removeFollower ───────────────

export const followMutationInputSchema = z.object({
  profileId: z.coerce.number().int().positive(),
});

export const followMutationDataSchema = z.object({
  success: z.boolean(),
});

export const followMutationResponseSchema = z.union([
  z.object({
    success: z.literal(true),
    data: followMutationDataSchema,
    message: z.string().optional(),
    error: z.null().optional(),
  }),
  apiErrorResponseSchema,
]);

export const followMutationResultSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
});

// ─── getSuggestions ───────────────────────────────────────────────────────────

export const suggestionDataSchema = z.object({
  id: z.number().int().positive(),
  username: z.string().min(1),
  fullName: z.string().nullable().optional(),
  profileImageUrl: z.string().nullable().optional(),
  followersCount: z.number().int().nonnegative(),
});

export const suggestionsResponseSchema = z.union([
  z.object({
    success: z.literal(true),
    data: z.array(suggestionDataSchema),
    message: z.string().optional(),
    error: z.null().optional(),
  }),
  apiErrorResponseSchema,
]);

export const getSuggestionsResultSchema = z.object({
  success: z.boolean(),
  data: z.array(suggestionDataSchema).optional(),
  error: z.string().optional(),
});

// ─── Types ────────────────────────────────────────────────────────────────────

export type GetFollowStatusInput = z.infer<typeof getFollowStatusInputSchema>;
export type FollowStatusData = z.infer<typeof followStatusDataSchema>;
export type GetFollowStatusResult = z.infer<typeof getFollowStatusResultSchema>;

export type GetFollowersInput = z.infer<typeof getFollowersInputSchema>;
export type FollowerData = z.infer<typeof followerDataSchema>;
export type GetFollowersResult = z.infer<typeof getFollowersResultSchema>;

export type GetFollowingInput = z.infer<typeof getFollowingInputSchema>;
export type GetFollowingResult = z.infer<typeof getFollowingResultSchema>;

export type ToggleFollowInput = z.infer<typeof toggleFollowInputSchema>;
export type ToggleFollowData = z.infer<typeof toggleFollowDataSchema>;
export type ToggleFollowResult = z.infer<typeof toggleFollowResultSchema>;

export type FollowMutationInput = z.infer<typeof followMutationInputSchema>;
export type FollowMutationResult = z.infer<typeof followMutationResultSchema>;

export type SuggestionData = z.infer<typeof suggestionDataSchema>;
export type GetSuggestionsResult = z.infer<typeof getSuggestionsResultSchema>;
