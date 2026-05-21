"use server";

import { redirect } from 'next/navigation';

import { springFetch } from '@/lib/spring-client';
import { SpringAuthError } from '@/lib/spring-error';
import type { Comment, GetCommentsResponse } from '@/types/feed';
import {
  commentBackendResponseSchema,
  commentBackendSchema,
  commentListBackendDataSchema,
  type CommentBackend,
  createCommentInputSchema,
  deleteCommentInputSchema,
  listCommentsInputSchema,
  type CreateCommentInput,
  type DeleteCommentInput,
  type ListCommentsInput,
} from './schema';

export type CommentsActionResult<T> = { success: true; data: T } | { success: false; error: string };

function mapCommentBackendToFrontend(comment: CommentBackend): Comment {
  return {
    id: comment.id,
    post_id: comment.postId,
    profile_id: comment.profileId,
    parent_id: comment.parentId,
    text: comment.text,
    likes_count: comment.likesCount,
    created_at: comment.createdAt,
    profile_username: comment.profileUsername,
    profile_full_name: comment.profileFullName,
    profile_image_url: comment.profileImageUrl,
    profile_is_verified: comment.profileIsVerified,
    profile_has_active_story: comment.profileHasActiveStory,
    profile_has_viewed_story: comment.profileHasViewedStory,
    profile_is_private: comment.profileIsPrivate,
    is_liked_by_current_user: comment.isLikedByCurrentUser,
  };
}

function mapCommentsError(status: number): string {
  if (status === 400) return 'Invalid comment request.';
  if (status === 401) return 'Session expired, please log in again.';
  if (status === 403) return 'You cannot comment on this post.';
  if (status === 404) return 'Post not found.';
  return 'Comments service temporarily unavailable.';
}

async function readJson(response: Response): Promise<unknown | null> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function fetchCommentsJson(path: string, init?: RequestInit): Promise<Response | null> {
  try {
    return await springFetch(path, init);
  } catch (error) {
    if (error instanceof SpringAuthError) {
      redirect('/login');
    }
    return null;
  }
}

export async function listCommentsAction(input: ListCommentsInput): Promise<CommentsActionResult<GetCommentsResponse>> {
  const parsedInput = listCommentsInputSchema.safeParse(input);
  if (!parsedInput.success) {
    return { success: false, error: 'Invalid comments input.' };
  }

  const { postId, limit, offset } = parsedInput.data;
  const query = new URLSearchParams();
  query.set('postId', String(postId));
  if (limit !== undefined) query.set('limit', String(limit));
  if (offset !== undefined) query.set('offset', String(offset));

  const response = await fetchCommentsJson(`/api/priv/comments?${query.toString()}`);
  if (!response) {
    return { success: false, error: 'Comments service is unreachable.' };
  }

  if (!response.ok) {
    return { success: false, error: mapCommentsError(response.status) };
  }

  const payload = await readJson(response);
  const envelope = commentBackendResponseSchema.safeParse(payload);
  if (!envelope.success) {
    return { success: false, error: 'Invalid comments response payload.' };
  }

  if (!envelope.data.success) {
    return {
      success: false,
      error: envelope.data.error || envelope.data.message || 'Comments service temporarily unavailable.',
    };
  }

  const parsedData = commentListBackendDataSchema.safeParse(envelope.data.data);
  if (!parsedData.success) {
    return { success: false, error: 'Invalid comments response payload.' };
  }

  return {
    success: true,
    data: {
      comments: parsedData.data.comments.map(mapCommentBackendToFrontend),
      total: parsedData.data.total,
      hasMore: parsedData.data.hasMore,
    },
  };
}

export async function createCommentAction(input: CreateCommentInput): Promise<CommentsActionResult<Comment>> {
  const parsedInput = createCommentInputSchema.safeParse(input);
  if (!parsedInput.success) {
    return { success: false, error: 'Invalid comment input.' };
  }

  const response = await fetchCommentsJson('/api/priv/comments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(parsedInput.data),
  });

  if (!response) {
    return { success: false, error: 'Comments service is unreachable.' };
  }

  if (!response.ok) {
    return { success: false, error: mapCommentsError(response.status) };
  }

  const payload = await readJson(response);
  const envelope = commentBackendResponseSchema.safeParse(payload);
  if (!envelope.success) {
    return { success: false, error: 'Invalid comments response payload.' };
  }

  if (!envelope.data.success) {
    return {
      success: false,
      error: envelope.data.error || envelope.data.message || 'Failed to create comment.',
    };
  }

  const parsedData = commentBackendSchema.safeParse(envelope.data.data);
  if (!parsedData.success) {
    return { success: false, error: 'Invalid comments response payload.' };
  }

  return {
    success: true,
    data: mapCommentBackendToFrontend(parsedData.data),
  };
}

export async function deleteCommentAction(input: DeleteCommentInput): Promise<CommentsActionResult<void>> {
  const parsedInput = deleteCommentInputSchema.safeParse(input);
  if (!parsedInput.success) {
    return { success: false, error: 'Invalid comment input.' };
  }

  const response = await fetchCommentsJson(`/api/priv/comments/${parsedInput.data.commentId}`, {
    method: 'DELETE',
  });

  if (!response) {
    return { success: false, error: 'Comments service is unreachable.' };
  }

  if (!response.ok) {
    return { success: false, error: mapCommentsError(response.status) };
  }

  const payload = await readJson(response);
  const envelope = commentBackendResponseSchema.safeParse(payload);
  if (!envelope.success) {
    return { success: false, error: 'Invalid comments response payload.' };
  }

  if (!envelope.data.success) {
    return {
      success: false,
      error: envelope.data.error || envelope.data.message || 'Failed to delete comment.',
    };
  }

  return { success: true, data: undefined };
}
