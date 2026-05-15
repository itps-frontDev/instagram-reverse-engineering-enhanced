import { z } from 'zod';

export const personalProfileInputSchema = z.object({
  username: z.string().trim().min(1),
  full_name: z.string().nullable().optional(),
});

export const personalProfileSuccessResponseSchema = z.object({
  success: z.literal(true),
  profile: z
    .object({
      username: z.string().min(1),
      full_name: z.string().nullable().optional(),
    })
    .optional(),
  message: z.string().optional(),
  error: z.null().optional(),
});

export const personalProfileErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string().optional(),
  message: z.string().optional(),
});

export const personalProfileResponseSchema = z.union([
  personalProfileSuccessResponseSchema,
  personalProfileErrorResponseSchema,
]);

export type PersonalProfileActionResult = { success: true } | { success: false; error: string };
