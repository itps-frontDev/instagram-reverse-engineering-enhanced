import { z } from 'zod';

// Input schema for can-view action
export const canViewProfileInputSchema = z.object({
  username: z.string().min(1, 'Username is required'),
});

// Response data schema when success is true
export const profileVisibilityDataSchema = z.object({
  canView: z.boolean(),
});

// Uniform API response schema - success case
export const profileVisibilitySuccessResponseSchema = z.object({
  success: z.literal(true),
  data: profileVisibilityDataSchema,
  message: z.string().optional(),
  error: z.null().optional(),
});

// Uniform API response schema - error case
export const profileVisibilityErrorResponseSchema = z.object({
  success: z.literal(false),
  data: z.never().optional(),
  message: z.string().optional(),
  error: z.string(),
});

// Union of success and error responses
export const profileVisibilityResponseSchema = z.union([
  profileVisibilitySuccessResponseSchema,
  profileVisibilityErrorResponseSchema,
]);

// Normalized action result for UI consumption
export const canViewProfileResultSchema = z.object({
  success: z.boolean(),
  data: z
    .object({
      canView: z.boolean(),
    })
    .optional(),
  error: z.string().optional(),
});

// Input schema for follow-status action
export const getFollowStatusInputSchema = z.object({
  username: z.string().min(1, 'Username is required'),
});

// Response data schema when success is true
export const followStatusDataSchema = z.object({
  status: z.enum(['self', 'none', 'pending', 'accepted']),
});

// Uniform API response schema - success case
export const followStatusSuccessResponseSchema = z.object({
  success: z.literal(true),
  data: followStatusDataSchema,
  message: z.string().optional(),
  error: z.null().optional(),
});

// Uniform API response schema - error case
export const followStatusErrorResponseSchema = z.object({
  success: z.literal(false),
  data: z.never().optional(),
  message: z.string().optional(),
  error: z.string(),
});

// Union of success and error responses
export const followStatusResponseSchema = z.union([
  followStatusSuccessResponseSchema,
  followStatusErrorResponseSchema,
]);

// Normalized action result for UI consumption
export const getFollowStatusResultSchema = z.object({
  success: z.boolean(),
  data: z
    .object({
      status: z.enum(['self', 'none', 'pending', 'accepted']),
    })
    .optional(),
  error: z.string().optional(),
});

export type CanViewProfileInput = z.infer<typeof canViewProfileInputSchema>;
export type ProfileVisibilityData = z.infer<typeof profileVisibilityDataSchema>;
export type ProfileVisibilityResponse = z.infer<typeof profileVisibilityResponseSchema>;
export type CanViewProfileResult = z.infer<typeof canViewProfileResultSchema>;

export type GetFollowStatusInput = z.infer<typeof getFollowStatusInputSchema>;
export type FollowStatusData = z.infer<typeof followStatusDataSchema>;
export type FollowStatusResponse = z.infer<typeof followStatusResponseSchema>;
export type GetFollowStatusResult = z.infer<typeof getFollowStatusResultSchema>;