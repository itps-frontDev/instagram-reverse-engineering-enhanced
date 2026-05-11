import { z } from "zod";

export const authActionResultSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.union([
    z.object({ success: z.literal(true), data: dataSchema }),
    z.object({ success: z.literal(false), error: z.string().min(1) }),
  ]);

export const loginInputSchema = z.object({
  identifier: z.string().trim().min(1),
  password: z.string().min(1),
  redirect: z.string().trim().optional(),
});

export const loginDataSchema = z.object({
  redirectTo: z.string().trim().min(1),
});

export const registerBirthDateSchema = z.object({
  day: z.string().trim().min(1),
  month: z.string().trim().min(1),
  year: z.string().trim().min(1),
});

export const registerInputSchema = z.object({
  email: z.string().trim().email(),
  username: z.string().trim().min(1),
  password: z.string().min(1),
  fullName: z.string().trim().optional(),
  birthDate: registerBirthDateSchema.optional(),
});

export const registerDataSchema = z.object({
  message: z.string().min(1),
  userId: z.string().trim().min(1),
  username: z.string().trim().min(1),
});

export type AuthActionResult<T> = { success: true; data: T } | { success: false; error: string };
export type LoginInput = z.infer<typeof loginInputSchema>;
export type LoginData = z.infer<typeof loginDataSchema>;
export type RegisterInput = z.infer<typeof registerInputSchema>;
export type RegisterData = z.infer<typeof registerDataSchema>;
