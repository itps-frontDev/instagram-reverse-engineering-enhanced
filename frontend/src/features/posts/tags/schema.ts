import { z } from "zod";

/**
 * Schema Zod per un singolo tag di post.
 * 
 * Corrisponde a PostTagDTO del backend:
 * - taggedUsername: Username del profilo taggato
 * - xPosition, yPosition: Coordinate di posizionamento
 * - createdAt: Timestamp in formato ISO string
 */
export const postTagSchema = z.object({
  taggedUsername: z.string().min(1),
  xPosition: z.number().min(0),
  yPosition: z.number().min(0),
  createdAt: z.string(),
});

export type PostTag = z.infer<typeof postTagSchema>;

/**
 * Schema della risposta API per GET /api/priv/posts/{postId}/tags
 */
export const getPostTagsResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(postTagSchema),
  message: z.string().nullable().optional(),
  error: z.string().nullable().optional(),
});

export type GetPostTagsResponse = z.infer<typeof getPostTagsResponseSchema>;
