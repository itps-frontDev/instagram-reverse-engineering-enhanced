/**
 * @fileoverview API route for serving media files.
 *
 * This route handles requests to `/api/media/[access]/[category]/[filename]`
 * where:
 * - `access`: 'public' or 'private'
 * - `category`: 'profiles', 'posts', 'stories', or 'messages'
 * - `filename`: The unique file identifier
 *
 * Public files are served without authentication.
 * Private files require a valid Authorization header.
 *
 * @module api/media/[...path]
 *
 * @example
 * // Access a public post image
 * GET /api/media/public/posts/abc-123.jpg
 *
 * // Access a private message attachment (requires auth)
 * GET /api/media/private/messages/xyz-789.pdf
 * Authorization: Bearer <token>
 */

import { NextRequest, NextResponse } from "next/server";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { getMimeType, type MediaCategory, type AccessType } from "@/lib/storage";

// ============================================================================
// CONFIGURATION
// ============================================================================

/** Base directory for uploaded files */
const UPLOADS_DIR = join(process.cwd(), "data", "uploads");

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
 * Route pattern: /api/media/[access]/[category]/[filename]
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
      { error: "Invalid path. Expected: /api/media/[access]/[category]/[filename]" },
      { status: 400 }
    );
  }

  const [accessType, category, filename] = path;

  // ========================================================================
  // VALIDATION
  // ========================================================================

  // Validate access type
  if (accessType !== "public" && accessType !== "private") {
    return NextResponse.json(
      { error: "Invalid access type. Must be 'public' or 'private'" },
      { status: 400 }
    );
  }

  // Validate category
  if (!VALID_CATEGORIES.includes(category as MediaCategory)) {
    return NextResponse.json(
      { error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}` },
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
  // AUTHORIZATION (for private files)
  // ========================================================================

  if (accessType === "private") {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authentication required for private content" },
        { status: 401 }
      );
    }

    // TODO: Implement proper JWT verification
    // const token = authHeader.substring(7);
    // const user = await verifyToken(token);
    //
    // TODO: Implement content-specific authorization
    // - Posts/Stories: Check if user follows the private account
    // - Messages: Check if user is a participant in the chat
    // - Profiles: Check if user has permission to view
  }

  // ========================================================================
  // FILE RETRIEVAL
  // ========================================================================

  const filePath = join(UPLOADS_DIR, accessType, category, filename);

  // Check if file exists
  if (!existsSync(filePath)) {
    return NextResponse.json(
      { error: "File not found" },
      { status: 404 }
    );
  }

  // Read file
  let fileBuffer: Buffer;
  try {
    fileBuffer = readFileSync(filePath);
  } catch (error) {
    console.error("[Media API] Error reading file:", error);
    return NextResponse.json(
      { error: "Failed to read file" },
      { status: 500 }
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
      // Cache public files aggressively, private files less so
      "Cache-Control": accessType === "public"
        ? `public, max-age=${CACHE_MAX_AGE}, immutable`
        : "private, max-age=3600",
      // Security headers
      "X-Content-Type-Options": "nosniff",
    },
  });
}
