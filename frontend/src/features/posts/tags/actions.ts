'use server';

import { cookies } from 'next/headers';
import { getAccessTokenCookieName } from '@/lib/auth/backend';
import { getPostTagsResponseSchema } from './schema';
import type { PostTag } from './schema';

function truncateLog(value: string, maxLength = 500): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength)}...<truncated>`;
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
    console.info(`[PostTags] Fetch started - postId: ${postId}, url: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      next: { tags: [`post-tags-${postId}`] },
    } as any);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(
        `[PostTags] API error - postId: ${postId}, status: ${response.status}, statusText: ${response.statusText}, body: ${truncateLog(errorBody)}`
      );
      return {
        success: false,
        data: [],
        error: response.statusText || 'Failed to fetch tags',
      };
    }

    const rawBody = await response.text();
    console.info(`[PostTags] API response received - postId: ${postId}, body: ${truncateLog(rawBody)}`);

    const jsonData = JSON.parse(rawBody);

    // Valida la risposta con Zod
    const validationResult = getPostTagsResponseSchema.safeParse(jsonData);
    if (!validationResult.success) {
      console.error(
        `[PostTags] Validation error - postId: ${postId}, issues: ${JSON.stringify(validationResult.error.issues)}, payload: ${truncateLog(rawBody)}`
      );
      return {
        success: false,
        data: [],
        error: 'Invalid response format',
      };
    }

    console.info(
      `[PostTags] Fetch completed - postId: ${postId}, tags: ${validationResult.data.data?.length ?? 0}`
    );

    return {
      success: true,
      data: validationResult.data.data || [],
    };
  } catch (error) {
    console.error(`[PostTags] Unexpected error - postId: ${postId}:`, error);
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
