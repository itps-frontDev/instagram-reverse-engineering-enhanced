import { z } from 'zod';

export const getFollowStatusInputSchema = z.object({
  username: z.string().min(1, 'Username is required'),
});

export const followStatusDataSchema = z.object({
  status: z.enum(['self', 'none', 'pending', 'accepted']),
});

export const followStatusSuccessResponseSchema = z.object({
  success: z.literal(true),
  data: followStatusDataSchema,
  message: z.string().optional(),
  error: z.null().optional(),
});

export const followStatusErrorResponseSchema = z.object({
  success: z.literal(false),
  data: z.never().optional(),
  message: z.string().optional(),
  error: z.string(),
});

export const followStatusResponseSchema = z.union([
  followStatusSuccessResponseSchema,
  followStatusErrorResponseSchema,
]);

export const getFollowStatusResultSchema = z.object({
  success: z.boolean(),
  data: z
    .object({
      status: z.enum(['self', 'none', 'pending', 'accepted']),
    })
    .optional(),
  error: z.string().optional(),
});

export const getProfileFollowersInputSchema = z.object({
  username: z.string().min(1, 'Username is required'),
});

export const profileFollowerDataSchema = z.object({
  id: z.number().int().positive(),
  username: z.string().min(1),
  fullName: z.string().nullable().optional(),
  profileImageUrl: z.string().nullable().optional(),
  followStatus: z.enum(['none', 'pending', 'accepted']),
});

export const profileFollowersSuccessResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(profileFollowerDataSchema),
  message: z.string().optional(),
  error: z.null().optional(),
});

export const profileFollowersErrorResponseSchema = z.object({
  success: z.literal(false),
  data: z.never().optional(),
  message: z.string().optional(),
  error: z.string(),
});

export const profileFollowersResponseSchema = z.union([
  profileFollowersSuccessResponseSchema,
  profileFollowersErrorResponseSchema,
]);

export const getProfileFollowersResultSchema = z.object({
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

export const getProfileFollowingInputSchema = z.object({
  username: z.string().min(1, 'Username is required'),
});

export const profileFollowingSuccessResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(profileFollowerDataSchema),
  message: z.string().optional(),
  error: z.null().optional(),
});

export const profileFollowingErrorResponseSchema = z.object({
  success: z.literal(false),
  data: z.never().optional(),
  message: z.string().optional(),
  error: z.string(),
});

export const profileFollowingResponseSchema = z.union([
  profileFollowingSuccessResponseSchema,
  profileFollowingErrorResponseSchema,
]);

export const getProfileFollowingResultSchema = z.object({
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

export type GetFollowStatusInput = z.infer<typeof getFollowStatusInputSchema>;
export type FollowStatusData = z.infer<typeof followStatusDataSchema>;
export type FollowStatusResponse = z.infer<typeof followStatusResponseSchema>;
export type GetFollowStatusResult = z.infer<typeof getFollowStatusResultSchema>;
export type GetProfileFollowersInput = z.infer<typeof getProfileFollowersInputSchema>;
export type ProfileFollowerData = z.infer<typeof profileFollowerDataSchema>;
export type ProfileFollowersResponse = z.infer<typeof profileFollowersResponseSchema>;
export type GetProfileFollowersResult = z.infer<typeof getProfileFollowersResultSchema>;
export type GetProfileFollowingInput = z.infer<typeof getProfileFollowingInputSchema>;
export type ProfileFollowingResponse = z.infer<typeof profileFollowingResponseSchema>;
export type GetProfileFollowingResult = z.infer<typeof getProfileFollowingResultSchema>;
