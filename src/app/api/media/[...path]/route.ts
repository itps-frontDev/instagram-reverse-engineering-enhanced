/**
 * @fileoverview API route for serving media files.
 *
 * This route handles requests to `/api/media/[category]/[entityId]/[filename]`
 * where:
 * - `category`: 'profiles', 'posts', 'stories', or 'messages'
 * - `entityId`: The ID of the related entity (userId, postId, etc.)
 * - `filename`: The unique file identifier
 *
 * IMPORTANT: Access control is handled here based on database lookups.
 * Files are NOT separated into public/private folders. Instead, we check
 * permissions at request time by looking up the entity in the database.
 *
 * @module api/media/[...path]
 *
 * @example
 * // Access a post image
 * GET /api/media/posts/123/abc-uuid.jpg
 *
 * // Access a profile picture
 * GET /api/media/profiles/456/xyz-uuid.png
 */

import { NextRequest, NextResponse } from "next/server";
import { readFile, getMimeType, type MediaCategory } from "@/lib/storage";
// import { queryOne } from "@/lib/db";  // Uncomment when implementing auth

// ============================================================================
// CONFIGURATION
// ============================================================================

/** Valid media categories */
const VALID_CATEGORIES: MediaCategory[] = ["profiles", "posts", "stories", "messages"];

/** Cache duration for static files (1 year in seconds) */
const CACHE_MAX_AGE = 31536000;

// ============================================================================
// ROUTE HANDLER
// ============================================================================

/**
 * Handles GET requests for media files.
 *
 * Route pattern: /api/media/[category]/[entityId]/[filename]
 *
 * @param request - The incoming HTTP request
 * @param params - Route parameters containing the path segments
 * @returns The file content with appropriate headers, or an error response
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
  const { path } = await params;

  // Validate path structure
  if (!path || path.length < 3) {
    return NextResponse.json(
      { error: "Invalid path. Expected: /api/media/[category]/[entityId]/[filename]" },
      { status: 400 }
    );
  }

  const [category, entityId, filename] = path;

  // ========================================================================
  // VALIDATION
  // ========================================================================

  // Validate category
  if (!VALID_CATEGORIES.includes(category as MediaCategory)) {
    return NextResponse.json(
      { error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}` },
      { status: 400 }
    );
  }

  // Validate entityId (should be a number or UUID-like string)
  if (!entityId || entityId.includes("..")) {
    return NextResponse.json(
      { error: "Invalid entity ID" },
      { status: 400 }
    );
  }

  // Validate filename (prevent directory traversal)
  if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
    return NextResponse.json(
      { error: "Invalid filename" },
      { status: 400 }
    );
  }

  // ========================================================================
  // AUTHORIZATION
  // ========================================================================
  //
  // TODO: Implement proper authorization based on category:
  //
  // For POSTS:
  // const post = queryOne('SELECT * FROM posts WHERE id = ?', [entityId]);
  // const owner = queryOne('SELECT * FROM users WHERE id = ?', [post.user_id]);
  // if (owner.is_private) {
  //   const currentUser = getCurrentUserFromRequest(request);
  //   if (!currentUser) return 401 Unauthorized;
  //   const isFollower = queryOne(
  //     'SELECT * FROM follows WHERE follower_id = ? AND following_id = ? AND status = "accepted"',
  //     [currentUser.id, owner.id]
  //   );
  //   if (!isFollower) return 403 Forbidden;
  // }
  //
  // For STORIES:
  // Similar to posts, but also check if story has expired
  //
  // For MESSAGES:
  // Check if current user is a participant in the chat
  //
  // For PROFILES:
  // Profile pictures are usually public, but could check privacy settings

  // ========================================================================
  // FILE RETRIEVAL
  // ========================================================================

  const fileBuffer = readFile(category as MediaCategory, entityId, filename);

  // Check if file exists
  if (!fileBuffer) {
    return NextResponse.json(
      { error: "File not found" },
      { status: 404 }
    );
  }

  // Determine content type
  const contentType = getMimeType(filename);

  // ========================================================================
  // RESPONSE
  // ========================================================================

  // Convert Buffer to Uint8Array for NextResponse compatibility
  const uint8Array = new Uint8Array(fileBuffer);

  return new NextResponse(uint8Array, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Length": fileBuffer.length.toString(),
      // Cache files aggressively (they have unique UUIDs)
      "Cache-Control": `public, max-age=${CACHE_MAX_AGE}, immutable`,
      // Security headers
      "X-Content-Type-Options": "nosniff",
    },
  });
}
