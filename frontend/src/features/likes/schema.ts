import { z } from "zod";

export const likeableTypeSchema = z.enum(["post", "comment", "story"]);
export type LikeableType = z.infer<typeof likeableTypeSchema>;

export const toggleLikeInputSchema = z.object({
  likeableType: likeableTypeSchema,
  likeableId: z.coerce.number().int().positive(),
});
export type ToggleLikeInput = z.infer<typeof toggleLikeInputSchema>;

export type LikeToggleData = {
  liked: boolean;
  count: number;
};

export type LikesActionResult<T> = { success: true; data: T } | { success: false; error: string };
