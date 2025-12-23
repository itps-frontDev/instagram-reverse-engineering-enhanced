/**
 * @fileoverview Local file storage module for media uploads.
 *
 * This module handles saving, reading, and managing media files locally.
 * Files are organized by category and entity ID (user, post, story, etc.).
 *
 * IMPORTANT: Access control is NOT handled here. Permission checks must be
 * performed in the API routes that serve files, based on database lookups
 * (e.g., checking if user is private, if requester is a follower, etc.).
 *
 * Directory structure:
 * ```
 * data/uploads/
 * ├── profiles/{user_id}/
 * │   └── avatar.jpg
 * ├── posts/{post_id}/
 * │   ├── image1.jpg
 * │   └── image2.jpg
 * ├── stories/{story_id}/
 * │   └── video.mp4
 * └── messages/{message_id}/
 *     └── attachment.pdf
 * ```
 *
 * @module lib/storage
 *
 * @example
 * // Save a file
 * import { saveFile } from '@/lib/storage';
 *
 * const result = saveFile(buffer, 'photo.jpg', 'posts', postId);
 * console.log(result.url); // '/api/media/posts/123/abc-uuid.jpg'
 */

import {
  existsSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  unlinkSync,
  readdirSync,
  rmSync,
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
 * Each category has its own subdirectory.
 */
export type MediaCategory = "profiles" | "posts" | "stories" | "messages";

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
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Ensures a directory exists, creating it if necessary.
 *
 * @param dirPath - Absolute path to the directory
 */
function ensureDir(dirPath: string): void {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
}

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
 * @param entityId - The ID of the entity (user, post, story, message)
 * @param filename - The file's unique name
 * @returns Absolute path to the file
 */
function buildAbsolutePath(
  category: MediaCategory,
  entityId: string | number,
  filename: string
): string {
  return join(UPLOADS_DIR, category, String(entityId), filename);
}

/**
 * Builds the directory path for an entity.
 *
 * @param category - The media category
 * @param entityId - The ID of the entity
 * @returns Absolute path to the entity's directory
 */
function buildEntityDir(
  category: MediaCategory,
  entityId: string | number
): string {
  return join(UPLOADS_DIR, category, String(entityId));
}

// ============================================================================
// FILE OPERATIONS
// ============================================================================

/**
 * Saves a file to the storage system.
 *
 * Generates a unique filename to prevent collisions and organizes
 * the file by category and entity ID.
 *
 * @param buffer - The file content as a Buffer
 * @param originalName - Original filename (used for extension detection)
 * @param category - Where to store the file (profiles, posts, stories, messages)
 * @param entityId - The ID of the related entity (userId, postId, storyId, messageId)
 * @returns Upload result with filename, path, URL, size, and MIME type
 *
 * @example
 * // Save a post image
 * const result = saveFile(imageBuffer, 'vacation.jpg', 'posts', postId);
 * // result.url = '/api/media/posts/123/abc-uuid.jpg'
 *
 * @example
 * // Save a profile picture
 * const result = saveFile(avatarBuffer, 'avatar.png', 'profiles', userId);
 * // result.url = '/api/media/profiles/456/xyz-uuid.png'
 */
export function saveFile(
  buffer: Buffer,
  originalName: string,
  category: MediaCategory,
  entityId: string | number
): UploadResult {
  const entityDir = buildEntityDir(category, entityId);
  ensureDir(entityDir);

  const filename = generateFilename(originalName);
  const relativePath = join(category, String(entityId), filename);
  const absolutePath = join(entityDir, filename);

  // Write file to disk
  writeFileSync(absolutePath, buffer);

  return {
    filename,
    path: relativePath,
    url: `/api/media/${category}/${entityId}/${filename}`,
    size: buffer.length,
    mimeType: getMimeType(originalName),
  };
}

/**
 * Reads a file from storage.
 *
 * @param category - The media category
 * @param entityId - The ID of the related entity
 * @param filename - The unique filename
 * @returns File contents as Buffer, or null if file doesn't exist
 *
 * @example
 * const buffer = readFile('posts', 123, 'abc-uuid.jpg');
 * if (buffer) {
 *   // Process the file
 * }
 */
export function readFile(
  category: MediaCategory,
  entityId: string | number,
  filename: string
): Buffer | null {
  const absolutePath = buildAbsolutePath(category, entityId, filename);

  if (!existsSync(absolutePath)) {
    return null;
  }

  return readFileSync(absolutePath);
}

/**
 * Deletes a single file from storage.
 *
 * @param category - The media category
 * @param entityId - The ID of the related entity
 * @param filename - The unique filename
 * @returns true if file was deleted, false if it didn't exist
 *
 * @example
 * const deleted = deleteFile('posts', 123, 'abc-uuid.jpg');
 * if (deleted) {
 *   console.log('File removed successfully');
 * }
 */
export function deleteFile(
  category: MediaCategory,
  entityId: string | number,
  filename: string
): boolean {
  const absolutePath = buildAbsolutePath(category, entityId, filename);

  if (!existsSync(absolutePath)) {
    return false;
  }

  unlinkSync(absolutePath);
  return true;
}

/**
 * Deletes all files for an entity.
 *
 * Useful when deleting a post, story, or user account.
 * Removes the entire entity directory and all its contents.
 *
 * @param category - The media category
 * @param entityId - The ID of the entity to delete files for
 * @returns true if directory was deleted, false if it didn't exist
 *
 * @example
 * // When deleting a post, remove all its media
 * deleteEntityFiles('posts', postId);
 */
export function deleteEntityFiles(
  category: MediaCategory,
  entityId: string | number
): boolean {
  const entityDir = buildEntityDir(category, entityId);

  if (!existsSync(entityDir)) {
    return false;
  }

  rmSync(entityDir, { recursive: true, force: true });
  return true;
}

/**
 * Lists all files for an entity.
 *
 * @param category - The media category
 * @param entityId - The ID of the entity
 * @returns Array of filenames, or empty array if directory doesn't exist
 *
 * @example
 * const files = listEntityFiles('posts', 123);
 * // ['image1.jpg', 'image2.jpg']
 */
export function listEntityFiles(
  category: MediaCategory,
  entityId: string | number
): string[] {
  const entityDir = buildEntityDir(category, entityId);

  if (!existsSync(entityDir)) {
    return [];
  }

  return readdirSync(entityDir);
}

/**
 * Gets the absolute filesystem path for a file.
 *
 * @param category - The media category
 * @param entityId - The ID of the related entity
 * @param filename - The unique filename
 * @returns Absolute path if file exists, null otherwise
 *
 * @example
 * const path = getFilePath('posts', 123, 'abc-uuid.jpg');
 * // Returns: 'C:/project/data/uploads/posts/123/abc-uuid.jpg'
 */
export function getFilePath(
  category: MediaCategory,
  entityId: string | number,
  filename: string
): string | null {
  const absolutePath = buildAbsolutePath(category, entityId, filename);
  return existsSync(absolutePath) ? absolutePath : null;
}

/**
 * Checks if a file exists in storage.
 *
 * @param category - The media category
 * @param entityId - The ID of the related entity
 * @param filename - The unique filename
 * @returns true if file exists, false otherwise
 *
 * @example
 * if (fileExists('profiles', userId, 'avatar.jpg')) {
 *   // File is available
 * }
 */
export function fileExists(
  category: MediaCategory,
  entityId: string | number,
  filename: string
): boolean {
  const absolutePath = buildAbsolutePath(category, entityId, filename);
  return existsSync(absolutePath);
}
