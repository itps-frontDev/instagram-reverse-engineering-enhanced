import { z } from 'zod';

export const togglePostSaveInputSchema = z.object({
  postId: z.coerce.number().int().positive(),
});

const postSaveDataSchema = z.object({
  saved: z.boolean(),
});

const postSaveBackendSuccessSchema = z.object({
  success: z.literal(true),
  data: postSaveDataSchema,
  message: z.string().trim().optional(),
});

const postSaveBackendErrorSchema = z.object({
  success: z.literal(false),
  error: z.string().trim().min(1),
  message: z.string().trim().optional(),
});

export const postSaveBackendResponseSchema = z.union([
  postSaveBackendSuccessSchema,
  postSaveBackendErrorSchema,
]);

export const togglePostSaveResultSchema = z.union([
  z.object({
    success: z.literal(true),
    data: postSaveDataSchema,
  }),
  z.object({
    success: z.literal(false),
    error: z.string().trim().min(1),
  }),
]);

export type TogglePostSaveInput = z.infer<typeof togglePostSaveInputSchema>;
export type TogglePostSaveResult = z.infer<typeof togglePostSaveResultSchema>;
