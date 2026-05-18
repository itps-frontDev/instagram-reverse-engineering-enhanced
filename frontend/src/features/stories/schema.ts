import { z } from 'zod';

export const registerStoryViewInputSchema = z.object({
  storyId: z.coerce.number().int().positive(),
});

export const storyViewSuccessResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
});

export const storyViewErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string().optional(),
  message: z.string().optional(),
});

export const storyViewResponseSchema = z.union([
  storyViewSuccessResponseSchema,
  storyViewErrorResponseSchema,
]);

export const registerStoryViewResultSchema = z.object({
  success: z.boolean(),
  data: z
    .object({
      message: z.string(),
    })
    .optional(),
  error: z.string().optional(),
});

export type RegisterStoryViewInput = z.infer<typeof registerStoryViewInputSchema>;
export type StoryViewResponse = z.infer<typeof storyViewResponseSchema>;
export type RegisterStoryViewResult = z.infer<typeof registerStoryViewResultSchema>;
