import { z } from 'zod';

const phoneSchema = z.string().trim().max(15).regex(/^[\d\s\-+()]+$/, {
  message: 'Phone number can only contain digits, spaces, +, -, (, )',
});

export const securityDataSchema = z.object({
  email: z.string().email().nullable(),
  phoneNumber: z.string().nullable(),
});

export const getSecurityResponseSchema = z.object({
  success: z.boolean(),
  data: securityDataSchema.optional(),
  error: z.string().optional().nullable(),
  message: z.string().optional().nullable(),
});

export const updateSecurityInputSchema = z.object({
  email: z.string().trim().email().max(255).nullable().optional(),
  phoneNumber: phoneSchema.nullable().optional(),
  currentPassword: z.string().min(1).optional(),
  newPassword: z.string().min(6).optional(),
}).superRefine((value, ctx) => {
  const hasContact =
    Object.prototype.hasOwnProperty.call(value, 'email') ||
    Object.prototype.hasOwnProperty.call(value, 'phoneNumber');

  const hasPassword =
    value.currentPassword !== undefined || value.newPassword !== undefined;

  if (!hasContact && !hasPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'At least one field must be provided.',
    });
  }

  if ((value.currentPassword === undefined) !== (value.newPassword === undefined)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Both currentPassword and newPassword are required.',
    });
  }

  if (
    value.currentPassword !== undefined &&
    value.newPassword !== undefined &&
    value.currentPassword === value.newPassword
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'New password must be different from current password.',
    });
  }
});

export const updateSecurityResponseSchema = getSecurityResponseSchema;

export type UpdateSecurityInput = z.infer<typeof updateSecurityInputSchema>;
