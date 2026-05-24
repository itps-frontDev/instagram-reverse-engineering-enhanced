'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { springFetch } from '@/lib/spring-client';
import { SpringAuthError } from '@/lib/spring-error';
import { getAccessTokenCookieName, getRefreshTokenCookieName, refreshWithSpring } from '@/lib/auth/backend';
import { z } from 'zod';
import {
  getMessagesInputSchema,
  getOrCreateChatInputSchema,
  messageItemSchema,
  type GetChatsResult,
  type GetMessagesInput,
  type GetMessagesResult,
  type GetOrCreateChatInput,
  type GetOrCreateChatResult,
  type MessageItem,
} from './schema';

const sendMessageInputSchema = z.object({
  chatId: z.string().uuid(),
  text: z.string().min(1).max(1000),
});
type SendMessageInput = z.infer<typeof sendMessageInputSchema>;
type SendMessageResult = { success: true; data: MessageItem } | { success: false; error: string };

function mapDirectError(status: number): string {
  if (status === 403) return 'Access denied.';
  if (status === 404) return 'Chat or profile not found.';
  if (status === 400) return 'Invalid request.';
  return 'Direct messages service temporarily unavailable.';
}

export async function getChatsAction(): Promise<GetChatsResult> {
  let response: Response;
  try {
    response = await springFetch('/api/priv/direct/chats', { method: 'GET' });
  } catch (error) {
    if (error instanceof SpringAuthError) redirect('/login');
    return { success: false, error: 'Direct messages service is unreachable.' };
  }
  if (!response.ok) return { success: false, error: mapDirectError(response.status) };
  const payload = await response.json();
  return { success: true, data: payload.data ?? [] };
}

export async function getMessagesAction(input: GetMessagesInput): Promise<GetMessagesResult> {
  const parsed = getMessagesInputSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: 'Invalid chat ID.' };

  let response: Response;
  try {
    response = await springFetch(`/api/priv/direct/messages?chatId=${parsed.data.chatId}`, { method: 'GET' });
  } catch (error) {
    if (error instanceof SpringAuthError) redirect('/login');
    return { success: false, error: 'Direct messages service is unreachable.' };
  }
  if (!response.ok) return { success: false, error: mapDirectError(response.status) };
  const payload = await response.json();
  return { success: true, data: payload.data ?? [] };
}

export async function getOrCreateChatAction(input: GetOrCreateChatInput): Promise<GetOrCreateChatResult> {
  const parsed = getOrCreateChatInputSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: 'Invalid profile ID.' };

  let response: Response;
  try {
    response = await springFetch('/api/priv/direct/get-or-create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ otherProfileId: parsed.data.otherProfileId }),
    });
  } catch (error) {
    if (error instanceof SpringAuthError) redirect('/login');
    return { success: false, error: 'Direct messages service is unreachable.' };
  }
  if (!response.ok) return { success: false, error: mapDirectError(response.status) };
  const payload = await response.json();
  return { success: true, data: { chatId: payload.data.chatId } };
}

export async function sendMessageAction(input: SendMessageInput): Promise<SendMessageResult> {
  const parsed = sendMessageInputSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: 'Invalid input.' };

  let response: Response;
  try {
    response = await springFetch('/api/priv/direct/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId: parsed.data.chatId, text: parsed.data.text }),
    });
  } catch (error) {
    if (error instanceof SpringAuthError) redirect('/login');
    return { success: false, error: 'Direct messages service is unreachable.' };
  }
  if (!response.ok) return { success: false, error: mapDirectError(response.status) };
  const payload = await response.json();
  const messageParsed = messageItemSchema.safeParse(payload.data);
  if (!messageParsed.success) return { success: false, error: 'Invalid response payload.' };
  return { success: true, data: messageParsed.data };
}

export async function getAccessTokenForWsAction(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(getAccessTokenCookieName())?.value ?? null;
}

export async function refreshAndGetAccessTokenAction(): Promise<string | null> {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(getRefreshTokenCookieName())?.value;
  if (!refreshToken) return null;

  try {
    const tokenPayload = await refreshWithSpring(refreshToken);
    const secure = process.env.NODE_ENV === 'production';
    cookieStore.set({ name: getAccessTokenCookieName(), value: tokenPayload.accessToken, httpOnly: true, sameSite: 'lax', path: '/', maxAge: tokenPayload.expiresIn, secure });
    cookieStore.set({ name: getRefreshTokenCookieName(), value: tokenPayload.refreshToken, httpOnly: true, sameSite: 'lax', path: '/', maxAge: tokenPayload.refreshExpiresIn, secure });
    return tokenPayload.accessToken;
  } catch {
    return null;
  }
}
