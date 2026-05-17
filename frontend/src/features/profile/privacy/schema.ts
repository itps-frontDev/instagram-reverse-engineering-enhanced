import { z } from 'zod';

export const updatePrivacyInputSchema = z.object({
  isPrivate: z.boolean(),
});

export const privacyDataSchema = z.object({
  isPrivate: z.boolean(),
  promotedFollowsCount: z.number().int().nonnegative(),
});

export const privacyApiResponseSchema = z.object({
  success: z.boolean(),
  data: privacyDataSchema.optional(),
  error: z.string().optional().nullable(),
  message: z.string().optional().nullable(),
});

export type UpdatePrivacyInput = z.infer<typeof updatePrivacyInputSchema>;
export type PrivacyApiResponse = z.infer<typeof privacyApiResponseSchema>;
