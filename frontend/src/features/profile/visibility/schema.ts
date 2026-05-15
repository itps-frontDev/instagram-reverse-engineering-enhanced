import { z } from 'zod';

export const canViewProfileInputSchema = z.object({
  username: z.string().min(1, 'Username is required'),
});

export const profileVisibilityDataSchema = z.object({
  canView: z.boolean(),
});

export const profileVisibilitySuccessResponseSchema = z.object({
  success: z.literal(true),
  data: profileVisibilityDataSchema,
  message: z.string().optional(),
  error: z.null().optional(),
});

export const profileVisibilityErrorResponseSchema = z.object({
  success: z.literal(false),
  data: z.never().optional(),
  message: z.string().optional(),
  error: z.string(),
});

export const profileVisibilityResponseSchema = z.union([
  profileVisibilitySuccessResponseSchema,
  profileVisibilityErrorResponseSchema,
]);

export const canViewProfileResultSchema = z.object({
  success: z.boolean(),
  data: z
    .object({
      canView: z.boolean(),
    })
    .optional(),
  error: z.string().optional(),
});

export type CanViewProfileInput = z.infer<typeof canViewProfileInputSchema>;
export type ProfileVisibilityData = z.infer<typeof profileVisibilityDataSchema>;
export type ProfileVisibilityResponse = z.infer<typeof profileVisibilityResponseSchema>;
export type CanViewProfileResult = z.infer<typeof canViewProfileResultSchema>;
