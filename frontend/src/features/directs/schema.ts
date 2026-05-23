import { z } from 'zod';

// ─── Chat list ────────────────────────────────────────────────────────────────

export const chatSummarySchema = z.object({
  chatId: z.string().uuid().nullable(),
  otherProfileId: z.number().int(),
  otherUsername: z.string().nullable(),
  otherFullName: z.string().nullable(),
  otherProfileImageUrl: z.string().nullable(),
  lastMessageText: z.string().nullable(),
  lastMessageAt: z.string().nullable(),
  isFromMe: z.boolean().nullable(),
});
export type ChatSummary = z.infer<typeof chatSummarySchema>;

export const getChatsResultSchema = z.discriminatedUnion('success', [
  z.object({ success: z.literal(true), data: z.array(chatSummarySchema) }),
  z.object({ success: z.literal(false), error: z.string() }),
]);
export type GetChatsResult = z.infer<typeof getChatsResultSchema>;

// ─── Messages ─────────────────────────────────────────────────────────────────

export const messageItemSchema = z.object({
  id: z.string().uuid(),
  chatId: z.string().uuid(),
  senderProfileId: z.number().int(),
  text: z.string(),
  createdAt: z.string(),
});
export type MessageItem = z.infer<typeof messageItemSchema>;

export const getMessagesInputSchema = z.object({
  chatId: z.string().uuid(),
});
export type GetMessagesInput = z.infer<typeof getMessagesInputSchema>;

export const getMessagesResultSchema = z.discriminatedUnion('success', [
  z.object({ success: z.literal(true), data: z.array(messageItemSchema) }),
  z.object({ success: z.literal(false), error: z.string() }),
]);
export type GetMessagesResult = z.infer<typeof getMessagesResultSchema>;

// ─── Get or create chat ───────────────────────────────────────────────────────

export const getOrCreateChatInputSchema = z.object({
  otherProfileId: z.number().int().positive(),
});
export type GetOrCreateChatInput = z.infer<typeof getOrCreateChatInputSchema>;

export const getOrCreateChatResultSchema = z.discriminatedUnion('success', [
  z.object({ success: z.literal(true), data: z.object({ chatId: z.string().uuid() }) }),
  z.object({ success: z.literal(false), error: z.string() }),
]);
export type GetOrCreateChatResult = z.infer<typeof getOrCreateChatResultSchema>;
