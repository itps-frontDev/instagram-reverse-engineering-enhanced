/**
 * @fileoverview Local file storage module for media uploads.
 *
 * This module handles saving, reading, and managing media files locally.
 * Files are organized by access type (public/private) and category.
 *
 * Directory structure:
 * ```
 * data/uploads/
 * ├── public/           # Publicly accessible media (no auth required)
 * │   ├── profiles/     # Profile pictures
 * │   ├── posts/        # Post media from public accounts
 * │   └── stories/      # Stories from public accounts
 * └── private/          # Protected media (requires authentication)
 *     ├── profiles/     # Profile pictures (private accounts)
 *     ├── posts/        # Post media from private accounts
 *     ├── stories/      # Stories from private accounts
 *     └── messages/     # Direct message attachments
 * ```
 *
 * @module lib/storage
 *
 * @example
 * // Save a file
 * import { saveFile } from '@/lib/storage';
 *
 * const result = saveFile(buffer, 'photo.jpg', 'posts', false);
 * console.log(result.url); // '/api/media/public/posts/abc-123.jpg'
 */

import {
  existsSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  unlinkSync,
  renameSync,
} from "fs";
import { join, extname } from "path";
import { randomUUID } from "crypto";

// ============================================================================
// CONFIGURATION
// ============================================================================

/** Base directory for all data storage */
const DATA_DIR = join(process.cwd(), "data");

/** Directory for uploaded media files */
const UPLOADS_DIR = join(DATA_DIR, "uploads");

// ============================================================================
// TYPES
// ============================================================================

/**
 * Categories of media files.
 * Each category has its own subdirectory within public/ and private/.
 */
export type MediaCategory = "profiles" | "posts" | "stories" | "messages";

/**
 * Access level for media files.
 * - `public`: Accessible without authentication
 * - `private`: Requires authentication and authorization
 */
export type AccessType = "public" | "private";

/**
 * Result object returned after successfully saving a file.
 */
export interface UploadResult {
  /** Generated unique filename with extension */
  filename: string;
  /** Relative path from uploads directory */
  path: string;
  /** API URL to access the file */
  url: string;
  /** File size in bytes */
  size: number;
  /** Detected MIME type */
  mimeType: string;
}

/**
 * Mapping of file extensions to MIME types.
 * Used for content-type headers when serving files.
 */
const MIME_TYPES: Record<string, string> = {
  // Images
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  // Videos
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".avi": "video/x-msvideo",
  ".webm": "video/webm",
  ".mkv": "video/x-matroska",
  // Audio
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  // Documents
  ".pdf": "application/pdf",
};

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Creates all required storage directories if they don't exist.
 *
 * Should be called once at application startup to ensure
 * the directory structure is ready for file operations.
 *
 * @example
 * // Call at app initialization
 * initStorageDirectories();
 */
export function initStorageDirectories(): void {
  const directories = [
    join(UPLOADS_DIR, "public", "profiles"),
    join(UPLOADS_DIR, "public", "posts"),
    join(UPLOADS_DIR, "public", "stories"),
    join(UPLOADS_DIR, "private", "profiles"),
    join(UPLOADS_DIR, "private", "posts"),
    join(UPLOADS_DIR, "private", "stories"),
    join(UPLOADS_DIR, "private", "messages"),
  ];

  for (const dir of directories) {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generates a unique filename using UUID.
 *
 * @param originalName - Original filename with extension
 * @returns A new unique filename preserving the original extension
 *
 * @example
 * generateFilename('photo.jpg'); // 'a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg'
 */
function generateFilename(originalName: string): string {
  const ext = extname(originalName).toLowerCase();
  const uuid = randomUUID();
  return `${uuid}${ext}`;
}

/**
 * Determines the MIME type based on file extension.
 *
 * @param filename - Filename with extension
 * @returns The corresponding MIME type, or 'application/octet-stream' if unknown
 *
 * @example
 * getMimeType('photo.jpg');  // 'image/jpeg'
 * getMimeType('video.mp4');  // 'video/mp4'
 * getMimeType('file.xyz');   // 'application/octet-stream'
 */
export function getMimeType(filename: string): string {
  const ext = extname(filename).toLowerCase();
  return MIME_TYPES[ext] || "application/octet-stream";
}

/**
 * Builds the absolute filesystem path for a file.
 *
 * @param category - The media category
 * @param filename - The file's unique name
 * @param isPrivate - Whether the file is in the private directory
 * @returns Absolute path to the file
 */
function buildAbsolutePath(
  category: MediaCategory,
  filename: string,
  isPrivate: boolean
): string {
  const accessType: AccessType = isPrivate ? "private" : "public";
  return join(UPLOADS_DIR, accessType, category, filename);
}

// ============================================================================
// FILE OPERATIONS
// ============================================================================

/**
 * Saves a file to the storage system.
 *
 * Generates a unique filename to prevent collisions and organizes
 * the file in the appropriate directory based on category and access level.
 *
 * @param buffer - The file content as a Buffer
 * @param originalName - Original filename (used for extension detection)
 * @param category - Where to store the file (profiles, posts, stories, messages)
 * @param isPrivate - Whether the file should be private (requires auth to access)
 * @returns Upload result with filename, path, URL, size, and MIME type
 *
 * @example
 * // Save a public post image
 * const result = saveFile(imageBuffer, 'vacation.jpg', 'posts', false);
 * // result.url = '/api/media/public/posts/abc-123.jpg'
 *
 * @example
 * // Save a private message attachment
 * const result = saveFile(fileBuffer, 'document.pdf', 'messages', true);
 * // result.url = '/api/media/private/messages/xyz-789.pdf'
 */
export function saveFile(
  buffer: Buffer,
  originalName: string,
  category: MediaCategory,
  isPrivate: boolean
): UploadResult {
  // Ensure directories exist
  initStorageDirectories();

  const accessType: AccessType = isPrivate ? "private" : "public";
  const filename = generateFilename(originalName);
  const relativePath = join(accessType, category, filename);
  const absolutePath = join(UPLOADS_DIR, relativePath);

  // Write file to disk
  writeFileSync(absolutePath, buffer);

  return {
    filename,
    path: relativePath,
    url: `/api/media/${accessType}/${category}/${filename}`,
    size: buffer.length,
    mimeType: getMimeType(originalName),
  };
}

/**
 * Reads a file from storage.
 *
 * @param category - The media category
 * @param filename - The unique filename
 * @param isPrivate - Whether to look in the private directory
 * @returns File contents as Buffer, or null if file doesn't exist
 *
 * @example
 * const buffer = readFile('posts', 'abc-123.jpg', false);
 * if (buffer) {
 *   // Process the file
 * }
 */
export function readFile(
  category: MediaCategory,
  filename: string,
  isPrivate: boolean
): Buffer | null {
  const absolutePath = buildAbsolutePath(category, filename, isPrivate);

  if (!existsSync(absolutePath)) {
    return null;
  }

  return readFileSync(absolutePath);
}

/**
 * Deletes a file from storage.
 *
 * @param category - The media category
 * @param filename - The unique filename
 * @param isPrivate - Whether the file is in the private directory
 * @returns true if file was deleted, false if it didn't exist
 *
 * @example
 * const deleted = deleteFile('posts', 'abc-123.jpg', false);
 * if (deleted) {
 *   console.log('File removed successfully');
 * }
 */
export function deleteFile(
  category: MediaCategory,
  filename: string,
  isPrivate: boolean
): boolean {
  const absolutePath = buildAbsolutePath(category, filename, isPrivate);

  if (!existsSync(absolutePath)) {
    return false;
  }

  unlinkSync(absolutePath);
  return true;
}

/**
 * Moves a file between public and private directories.
 *
 * Useful when a user changes their account privacy settings,
 * requiring all their media to be moved accordingly.
 *
 * @param category - The media category
 * @param filename - The unique filename
 * @param fromPrivate - Current access level (true = private)
 * @param toPrivate - Target access level (true = private)
 * @returns New API URL for the file, or null if source doesn't exist
 *
 * @example
 * // User made their account private - move post to private
 * const newUrl = moveFile('posts', 'abc-123.jpg', false, true);
 * // Returns: '/api/media/private/posts/abc-123.jpg'
 */
export function moveFile(
  category: MediaCategory,
  filename: string,
  fromPrivate: boolean,
  toPrivate: boolean
): string | null {
  // No move needed if access level is the same
  if (fromPrivate === toPrivate) {
    const accessType: AccessType = fromPrivate ? "private" : "public";
    return `/api/media/${accessType}/${category}/${filename}`;
  }

  const fromPath = buildAbsolutePath(category, filename, fromPrivate);
  const toPath = buildAbsolutePath(category, filename, toPrivate);

  if (!existsSync(fromPath)) {
    return null;
  }

  // Use rename for atomic move (more efficient than copy+delete)
  renameSync(fromPath, toPath);

  const toAccessType: AccessType = toPrivate ? "private" : "public";
  return `/api/media/${toAccessType}/${category}/${filename}`;
}

/**
 * Gets the absolute filesystem path for a file.
 *
 * @param category - The media category
 * @param filename - The unique filename
 * @param isPrivate - Whether to look in the private directory
 * @returns Absolute path if file exists, null otherwise
 *
 * @example
 * const path = getFilePath('posts', 'abc-123.jpg', false);
 * // Returns: 'C:/project/data/uploads/public/posts/abc-123.jpg'
 */
export function getFilePath(
  category: MediaCategory,
  filename: string,
  isPrivate: boolean
): string | null {
  const absolutePath = buildAbsolutePath(category, filename, isPrivate);
  return existsSync(absolutePath) ? absolutePath : null;
}

/**
 * Checks if a file exists in storage.
 *
 * @param category - The media category
 * @param filename - The unique filename
 * @param isPrivate - Whether to check the private directory
 * @returns true if file exists, false otherwise
 *
 * @example
 * if (fileExists('profiles', 'avatar.jpg', false)) {
 *   // File is available
 * }
 */
export function fileExists(
  category: MediaCategory,
  filename: string,
  isPrivate: boolean
): boolean {
  const absolutePath = buildAbsolutePath(category, filename, isPrivate);
  return existsSync(absolutePath);
}

// ============================================================================
// INITIALIZATION ON IMPORT
// ============================================================================

// Initialize storage directories when this module is first imported
initStorageDirectories();
