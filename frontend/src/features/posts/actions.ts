'use server';

import { cookies } from 'next/headers';
import { springFetch } from '@/lib/spring-client';
import { SpringAuthError } from '@/lib/spring-error';
import { getAccessTokenCookieName } from '@/lib/auth/backend';
import {
  postSaveBackendResponseSchema,
  togglePostSaveInputSchema,
  togglePostSaveResultSchema,
  GetProfilePostsInputSchema,
  ProfilePostsResponseSchema,
  getPostDetailInputSchema,
  getPostDetailResultSchema,
  type TogglePostSaveInput,
  type TogglePostSaveResult,
  type GetProfilePostsInput,
  type ProfilePostsResponse,
  type GetPostDetailInput,
  type GetPostDetailResult,
  type DeletePostInput,
  type DeletePostResult,
  type UpdatePostCaptionInput,
  type UpdatePostCaptionResult,
  deletePostInputSchema,
  updatePostCaptionInputSchema,
} from './schema';

function mapPostSaveError(status: number): string {
  if (status === 400) return 'Invalid post save request.';
  if (status === 401) return 'Session expired, please log in again.';
  if (status === 404) return 'Post not found.';
  return 'Posts service temporarily unavailable.';
}

export async function togglePostSaveAction(input: TogglePostSaveInput): Promise<TogglePostSaveResult> {
  const parsedInput = togglePostSaveInputSchema.safeParse(input);
  if (!parsedInput.success) {
    return { success: false, error: 'Invalid post save input.' };
  }

  let response: Response;
  try {
    response = await springFetch(`/api/priv/posts/${parsedInput.data.postId}/save-toggle`, {
      method: 'POST',
    });
  } catch (error) {
    if (error instanceof SpringAuthError) {
      return { success: false, error: 'Session expired, please log in again.' };
    }
    return { success: false, error: 'Posts service is unreachable.' };
  }

  if (!response.ok) {
    return { success: false, error: mapPostSaveError(response.status) };
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return { success: false, error: 'Unexpected response from posts service.' };
  }

  const parsedPayload = postSaveBackendResponseSchema.safeParse(payload);
  if (!parsedPayload.success) {
    return { success: false, error: 'Invalid posts response payload.' };
  }

  if (!parsedPayload.data.success) {
    return {
      success: false,
      error: parsedPayload.data.message || parsedPayload.data.error || 'Posts service temporarily unavailable.',
    };
  }

  return togglePostSaveResultSchema.parse({
    success: true,
    data: {
      saved: parsedPayload.data.data.saved,
    },
  });
}

/**
 * Server Action: Recupera i post di un profilo dal backend Spring.
 * 
 * Endpoint: GET /api/priv/profiles/{username}/posts?tab={tab}&page={page}
 */
export async function getProfilePostsAction(input: GetProfilePostsInput) {
  try {
    // 1. Valida input
    const validatedInput = GetProfilePostsInputSchema.parse(input);

    // 2. Estrai access token
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(getAccessTokenCookieName())?.value;

    if (!accessToken) {
      return {
        success: false,
        error: 'No authentication token found',
      };
    }

    // 3. Fetch da Spring Boot
    const { username, tab = 'posts', page = 0 } = validatedInput;
    const params = new URLSearchParams({ tab, page: String(page) });
    const url = `${process.env.SPRING_API_BASE_URL}/api/priv/profiles/${encodeURIComponent(username)}/posts?${params}`;

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Sempre fresco per paginazione
    });

    // 4. Parse risposta
    const json = await res.json();

    // Gestisci errori HTTP
    if (!res.ok) {
      return {
        success: false,
        error: json.error || json.message || `HTTP ${res.status}`,
      };
    }

    // 5. Valida structure con Zod
    if (json.success && json.data) {
      const validated = ProfilePostsResponseSchema.parse(json.data);
      
      // 6. Mappa da camelCase (Spring) a snake_case (legacy type Post)
      const mappedPosts = validated.posts.map((p: ProfilePostsResponse['posts'][0]) => ({
        id: p.id,
        caption: p.caption,
        likes_count: p.likesCount,
        comments_count: p.commentsCount,
        created_at: p.createdAt,
        media_url: p.mediaUrl,
        media_type: p.mediaType,
        media_count: p.mediaCount,
      }));
      
      return {
        success: true,
        data: {
          posts: mappedPosts,
          hasMore: validated.hasMore,
          total: validated.posts.length,
        },
      };
    }

    return {
      success: false,
      error: json.error || 'Unknown error',
    };

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch profile posts';
    return {
      success: false,
      error: message,
    };
  }
}

function mapPostDetailError(status: number): string {
  if (status === 400) return 'Invalid post ID.';
  if (status === 401) return 'Session expired, please log in again.';
  if (status === 404) return 'Post not found.';
  return 'Posts service temporarily unavailable.';
}

function mapDeletePostError(status: number): string {
  if (status === 400) return 'Invalid post ID.';
  if (status === 401) return 'Session expired, please log in again.';
  if (status === 404) return 'Post not found.';
  return 'Posts service temporarily unavailable.';
}

function mapUpdatePostError(status: number): string {
  if (status === 400) return 'Invalid post update payload.';
  if (status === 401) return 'Session expired, please log in again.';
  if (status === 404) return 'Post not found.';
  return 'Posts service temporarily unavailable.';
}

/**
 * Server Action: Recupera il dettaglio di un singolo post dal backend Spring.
 * 
 * Endpoint: GET /api/priv/posts/{postId}
 * 
 * Include TUTTI i media del post ordinati per position (non solo il primo).
 */
export async function getPostDetailAction(input: GetPostDetailInput): Promise<GetPostDetailResult> {
  const parsedInput = getPostDetailInputSchema.safeParse(input);
  if (!parsedInput.success) {
    return { success: false, error: 'Invalid post ID.' };
  }

  let response: Response;
  try {
    response = await springFetch(`/api/priv/posts/${parsedInput.data.postId}`);
  } catch (error) {
    if (error instanceof SpringAuthError) {
      return { success: false, error: 'Session expired, please log in again.' };
    }
    return { success: false, error: 'Posts service is unreachable.' };
  }

  if (!response.ok) {
    return { success: false, error: mapPostDetailError(response.status) };
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return { success: false, error: 'Unexpected response from posts service.' };
  }

  const parsedPayload = getPostDetailResultSchema.safeParse(payload);
  if (!parsedPayload.success) {
    return { success: false, error: 'Invalid posts response payload.' };
  }

  return parsedPayload.data as GetPostDetailResult;
}

export async function deletePostAction(input: DeletePostInput): Promise<DeletePostResult> {
  const parsedInput = deletePostInputSchema.safeParse(input);
  if (!parsedInput.success) {
    return { success: false, error: 'Invalid post ID.' };
  }

  let response: Response;
  try {
    response = await springFetch(`/api/priv/posts/${parsedInput.data.postId}`, {
      method: 'DELETE',
    });
  } catch (error) {
    if (error instanceof SpringAuthError) {
      return { success: false, error: 'Session expired, please log in again.' };
    }
    return { success: false, error: 'Posts service is unreachable.' };
  }

  if (!response.ok) {
    return { success: false, error: mapDeletePostError(response.status) };
  }

  return { success: true };
}

export async function updatePostCaptionAction(input: UpdatePostCaptionInput): Promise<UpdatePostCaptionResult> {
  const parsedInput = updatePostCaptionInputSchema.safeParse(input);
  if (!parsedInput.success) {
    return { success: false, error: 'Invalid caption.' };
  }

  let response: Response;
  try {
    response = await springFetch(`/api/priv/posts/${parsedInput.data.postId}`, {
      method: 'PATCH',
      body: JSON.stringify({ caption: parsedInput.data.caption }),
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    if (error instanceof SpringAuthError) {
      return { success: false, error: 'Session expired, please log in again.' };
    }
    return { success: false, error: 'Posts service is unreachable.' };
  }

  if (!response.ok) {
    return { success: false, error: mapUpdatePostError(response.status) };
  }

  return {
    success: true,
    data: {
      caption: parsedInput.data.caption,
    },
  };
}
