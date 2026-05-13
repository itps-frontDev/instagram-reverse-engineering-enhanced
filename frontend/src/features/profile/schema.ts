import { z } from 'zod';

// Input schema for can-view action
export const canViewProfileInputSchema = z.object({
  username: z.string().min(1, 'Username is required'),
});

export type CanViewProfileInput = z.infer<typeof canViewProfileInputSchema>;

// Response data schema when success is true
export const profileVisibilityDataSchema = z.object({
  canView: z.boolean(),
});

export type ProfileVisibilityData = z.infer<typeof profileVisibilityDataSchema>;

// Uniform API response schema - success case
export const profileVisibilitySuccessResponseSchema = z.object({
  success: z.literal(true),
  data: profileVisibilityDataSchema,
  message: z.string().optional(),
  error: z.never().optional(),
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

export type ProfileVisibilityResponse = z.infer<typeof profileVisibilityResponseSchema>;

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

export type CanViewProfileResult = z.infer<typeof canViewProfileResultSchema>;
