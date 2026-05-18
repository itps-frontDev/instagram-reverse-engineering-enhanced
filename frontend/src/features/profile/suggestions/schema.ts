import { z } from 'zod';

// Input schema for get-suggestions action (no parameters)
export const getProfileSuggestionsInputSchema = z.object({});

// Response data schema when success is true
export const profileSuggestionDataSchema = z.object({
  id: z.number().int().positive(),
  username: z.string().min(1),
  fullName: z.string().nullable().optional(),
  profileImageUrl: z.string().nullable().optional(),
  followersCount: z.number().int().nonnegative(),
});

// Uniform API response schema - success case
export const profileSuggestionsSuccessResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(profileSuggestionDataSchema),
  message: z.string().optional(),
  error: z.null().optional(),
});

// Uniform API response schema - error case
export const profileSuggestionsErrorResponseSchema = z.object({
  success: z.literal(false),
  data: z.never().optional(),
  message: z.string().optional(),
  error: z.string(),
});

// Union of success and error responses
export const profileSuggestionsResponseSchema = z.union([
  profileSuggestionsSuccessResponseSchema,
  profileSuggestionsErrorResponseSchema,
]);

// Normalized action result for UI consumption
export const getProfileSuggestionsResultSchema = z.object({
  success: z.boolean(),
  data: z
    .array(
      z.object({
        id: z.number().int().positive(),
        username: z.string(),
        fullName: z.string().nullable(),
        profileImageUrl: z.string().nullable(),
        followersCount: z.number().int().nonnegative(),
      })
    )
    .optional(),
  error: z.string().optional(),
});

// Type exports
export type GetProfileSuggestionsInput = z.infer<typeof getProfileSuggestionsInputSchema>;
export type ProfileSuggestionData = z.infer<typeof profileSuggestionDataSchema>;
export type ProfileSuggestionsResponse = z.infer<typeof profileSuggestionsResponseSchema>;
export type GetProfileSuggestionsResult = z.infer<typeof getProfileSuggestionsResultSchema>;
