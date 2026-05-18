/**
 * @fileoverview Schema Zod per il feature birthday.
 * 
 * Contiene:
 * - Schema di validazione input (UpdateBirthdayInput)
 * - Schema di validazione risposta (BirthdayResponse)
 * - Tipi TypeScript inferiti via z.infer
 * 
 * @module features/profile/birthday/schema
 */

import { z } from 'zod';

// ============================================================================
// INPUT SCHEMA (PUT request body)
// ============================================================================

/**
 * Zod schema per la validazione dell'input di UPDATE birthday.
 * 
 * Validazioni:
 * - birthday: stringa obbligatoria
 * - Formato: YYYY-MM-DD
 * - Non può essere una data futura
 */
export const updateBirthdaySchema = z.object({
  birthday: z
    .string()
    .refine(
      (val) => /^\d{4}-\d{2}-\d{2}$/.test(val),
      "Format must be YYYY-MM-DD"
    )
    .refine(
      (val) => new Date(val) <= new Date(),
      "Birthday cannot be in the future"
    ),
});

// ============================================================================
// RESPONSE SCHEMAS (GET/PUT response bodies)
// ============================================================================

/**
 * Zod schema per la risposta di GET/PUT birthday.
 * Mappa come il DTO `BirthdayDataDTO` dal backend.
 */
export const birthdayResponseDataSchema = z.object({
  birthday: z.string(), // ISO date YYYY-MM-DD
});

/**
 * Schema completo della risposta di successo da backend.
 */
export const birthdayResponseSchema = z.object({
  success: z.literal(true),
  data: birthdayResponseDataSchema,
  message: z.string().optional(),
});

/**
 * Schema della risposta di errore da backend.
 */
export const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
});

/**
 * Union type di risposta (successo o errore).
 */
export const birthdayApiResponseSchema = z.union([
  birthdayResponseSchema,
  errorResponseSchema,
]);

// ============================================================================
// TYPE INFERENCE
// ============================================================================

/**
 * Input type per updateBirthdayAction.
 * Usato: updateBirthdayAction(input: UpdateBirthdayInput)
 */
export type UpdateBirthdayInput = z.infer<typeof updateBirthdaySchema>;

/**
 * Response type dal backend GET/PUT /api/priv/profiles/birthday.
 * Success case.
 */
export type BirthdayResponse = z.infer<typeof birthdayResponseSchema>;

/**
 * Error response type dal backend.
 */
export type ErrorResponse = z.infer<typeof errorResponseSchema>;

/**
 * Union type: risposta può essere successo o errore.
 */
export type BirthdayApiResponse = z.infer<typeof birthdayApiResponseSchema>;
