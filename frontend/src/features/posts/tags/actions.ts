'use server';

import { cookies } from 'next/headers';
import { getAccessTokenCookieName } from '@/lib/auth/backend';
import { getPostTagsResponseSchema } from './schema';
import type { PostTag } from './schema';

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
  postId: number
): Promise<{ success: boolean; data: PostTag[]; error?: string }> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(getAccessTokenCookieName())?.value;

    if (!accessToken) {
      console.error('[PostTags] No access token found');
      return { success: false, data: [], error: 'Not authenticated' };
    }

    const apiUrl = process.env.SPRING_API_BASE_URL;
    if (!apiUrl) {
      console.error('[PostTags] SPRING_API_BASE_URL not configured');
      return { success: false, data: [], error: 'API configuration missing' };
    }

    const url = `${apiUrl}/api/priv/posts/${postId}/tags`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      next: { tags: [`post-tags-${postId}`] },
    } as any);

    if (!response.ok) {
      console.error(`[PostTags] API error: ${response.status}`, response.statusText);
      return {
        success: false,
        data: [],
        error: response.statusText || 'Failed to fetch tags',
      };
    }

    const jsonData = await response.json();

    // Valida la risposta con Zod
    const validationResult = getPostTagsResponseSchema.safeParse(jsonData);
    if (!validationResult.success) {
      console.error('[PostTags] Validation error:', validationResult.error.errors);
      return {
        success: false,
        data: [],
        error: 'Invalid response format',
      };
    }

    return {
      success: true,
      data: validationResult.data.data || [],
    };
  } catch (error) {
    console.error('[PostTags] Unexpected error:', error);
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
