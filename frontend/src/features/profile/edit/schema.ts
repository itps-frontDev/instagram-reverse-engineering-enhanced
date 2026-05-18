import { z } from 'zod';

export const editProfileInputSchema = z.object({
  bio: z.string().nullable().optional(),
  website_url: z.string().nullable().optional(),
  gender: z.string().nullable().optional(),
  custom_gender: z.string().nullable().optional(),
});

export const editProfileSuccessResponseSchema = z.object({
  success: z.literal(true),
  profile: z
    .object({
      bio: z.string().nullable().optional(),
      website_url: z.string().nullable().optional(),
      gender: z.string().nullable().optional(),
      custom_gender: z.string().nullable().optional(),
    })
    .optional(),
  message: z.string().optional(),
  error: z.null().optional(),
});

export const editProfileErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string().optional(),
  message: z.string().optional(),
});

export const editProfileResponseSchema = z.union([
  editProfileSuccessResponseSchema,
  editProfileErrorResponseSchema,
]);

export type EditProfileInput = z.infer<typeof editProfileInputSchema>;
export type EditProfileResponse = z.infer<typeof editProfileResponseSchema>;
export type EditProfileActionResult = { success: true } | { success: false; error: string };
