import { z } from "zod";

export type PfpActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }
  | { success: false; requiresLogin: true };

export type PfpUploadData = {
  profileImageUrl: string;
};

export type PfpDeleteData = {
  profileImageUrl: null;
};

export const uploadPfpInputSchema = z.object({
  image: z.instanceof(File),
});
export type UploadPfpInput = z.infer<typeof uploadPfpInputSchema>;
