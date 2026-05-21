'use server';

import { springFetch } from '@/lib/spring-client';
import { SpringAuthError } from '@/lib/spring-error';
import { getPostTagsResponseSchema } from './schema';
import type { PostTag } from './schema';

function normalizePostId(postId: number | string): number | null {
  if (typeof postId === 'number') {
    return Number.isInteger(postId) && postId > 0 ? postId : null;
  }

  if (!/^\d+$/.test(postId)) {
    return null;
  }

  const parsed = Number(postId);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function mapPostTagsError(status: number): string {
  if (status === 400) return 'Invalid post id.';
  if (status === 401) return 'Session expired, please log in again.';
  if (status === 403) return 'You cannot view tags for this post.';
  if (status === 404) return 'Post not found.';
  return 'Tags service temporarily unavailable.';
}

/**
 * Server Action per fetch dei tag di un post.
 * 
 * Chiama: GET /api/priv/posts/{postId}/tags su Spring Boot
 * Ritorna: { success: boolean, data: PostTag[], error?: string }
 * 
 * @param postId - ID del post
 * @returns Result con tags oppure errore
 */
export async function fetchPostTagsAction(
  postId: number | string
): Promise<{ success: boolean; data: PostTag[]; error?: string }> {
  const normalizedPostId = normalizePostId(postId);
  if (normalizedPostId === null) {
    return { success: false, data: [], error: 'Invalid post id.' };
  }

  const path = `/api/priv/posts/${normalizedPostId}/tags`;
  let response: Response;

  try {
    response = await springFetch(path, { method: 'GET' });
  } catch (error) {
    if (error instanceof SpringAuthError) {
      return { success: false, data: [], error: 'Session expired, please log in again.' };
    }

    try {
      // Retry singolo per coprire errori transient di rete tra Next e Spring.
      response = await springFetch(path, { method: 'GET' });
    } catch {
      return { success: false, data: [], error: 'Tags service is unreachable.' };
    }
  }

  if (!response.ok) {
    return {
      success: false,
      data: [],
      error: mapPostTagsError(response.status),
    };
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return {
      success: false,
      data: [],
      error: 'Invalid tags response payload.',
    };
  }

  const parsedPayload = getPostTagsResponseSchema.safeParse(payload);
  if (!parsedPayload.success) {
    return {
      success: false,
      data: [],
      error: 'Invalid tags response payload.',
    };
  }

  if (!parsedPayload.data.success) {
    return {
      success: false,
      data: [],
      error: parsedPayload.data.error || parsedPayload.data.message || 'Failed to fetch tags.',
    };
  }

  return {
    success: true,
    data: parsedPayload.data.data || [],
  };
}
