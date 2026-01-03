/**
 * @fileoverview Create Post API endpoint
 *
 * POST /api/posts/create
 * Creates a new post with images and caption
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth';
import { execute, queryOne } from '@/lib/db';
import { saveFile } from '@/lib/storage';

export const runtime = 'nodejs';

interface CreatePostRequest {
  images: string[]; // base64 encoded images
  caption?: string;
  location?: string;
  isCommentsDisabled?: boolean;
  isLikesHidden?: boolean;
}

interface CreatePostResponse {
  success: boolean;
  postId?: number;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const currentProfile = await getCurrentProfile();
    if (!currentProfile) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Parse request body
    const body: CreatePostRequest = await request.json();
    const { images, caption, location, isCommentsDisabled, isLikesHidden } = body;

    // 3. Validate images
    if (!images || images.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one image is required' },
        { status: 400 }
      );
    }

    if (images.length > 10) {
      return NextResponse.json(
        { success: false, error: 'Maximum 10 images allowed' },
        { status: 400 }
      );
    }

    // 4. Begin transaction
    await execute('BEGIN TRANSACTION');

    try {
      // 5. Create post record
      const postResult = await execute(
        `INSERT INTO posts (
          profile_id, 
          caption, 
          location, 
          is_comments_disabled, 
          is_likes_hidden,
          created_at
        )
        VALUES (?, ?, ?, ?, ?, datetime('now', 'localtime'))`,
        [
          currentProfile.id,
          caption?.trim() || null,
          location?.trim() || null,
          isCommentsDisabled ? 1 : 0,
          isLikesHidden ? 1 : 0,
        ]
      );

      const postId = postResult.lastID;

      // 6. Save images and create post_media records
      for (let i = 0; i < images.length; i++) {
        const base64Image = images[i];
        
        // Extract base64 data (remove data:image/...;base64, prefix)
        const matches = base64Image.match(/^data:image\/(\w+);base64,(.+)$/);
        if (!matches) {
          throw new Error(`Invalid image format at position ${i}`);
        }

        const imageExtension = matches[1]; // jpeg, png, etc.
        const base64Data = matches[2];
        
        // Convert base64 to buffer
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Generate filename
        const filename = `image-${i}.${imageExtension}`;
        
        // Save file to storage
        const saveResult = saveFile(buffer, filename, 'posts', postId);
        
        // Create post_media record
        await execute(
          `INSERT INTO post_media (
            post_id, 
            media_url, 
            media_type, 
            position,
            created_at
          )
          VALUES (?, ?, 'image', ?, datetime('now'))`,
          [postId, saveResult.url, i]
        );
      }

      // 7. Increment profile posts_count
      await execute(
        `UPDATE profiles 
         SET posts_count = posts_count + 1,
             updated_at = datetime('now')
         WHERE id = ?`,
        [currentProfile.id]
      );

      // 8. Commit transaction
      await execute('COMMIT');

      const response: CreatePostResponse = {
        success: true,
        postId,
      };

      return NextResponse.json(response, { status: 201 });
    } catch (error) {
      // Rollback on error
      await execute('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('[Create Post] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
