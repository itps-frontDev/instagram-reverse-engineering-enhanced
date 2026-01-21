/**
 * @fileoverview Modulo di archiviazione file locale per upload media.
 *
 * Questo modulo gestisce il salvataggio, lettura e gestione di file media localmente.
 * I file sono organizzati per categoria e ID entità (utente, post, storia, ecc.).
 *
 * IMPORTANTE: Il controllo degli accessi NON è gestito qui. I controlli dei permessi devono essere
 * eseguiti nelle route API che servono i file, basandosi su lookup del database
 * (es. verificare se l'utente è privato, se il richiedente è un follower, ecc.).
 *
 * Struttura delle directory:
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
 * // Salva un file
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
// CONFIGURAZIONE
// ============================================================================

/** Directory base per tutta l'archiviazione dati */
const DATA_DIR = join(process.cwd(), "data");

/** Directory per file media caricati */
const UPLOADS_DIR = join(DATA_DIR, "uploads");

// ============================================================================
// TIPI
// ============================================================================

/**
 * Categorie di file media.
 * Ogni categoria ha la propria sottodirectory.
 */
export type MediaCategory = "profiles" | "posts" | "stories" | "messages";

/**
 * Oggetto risultato restituito dopo aver salvato con successo un file.
 */
export interface UploadResult {
  /** Nome file univoco generato con estensione */
  filename: string;
  /** Percorso relativo dalla directory uploads */
  path: string;
  /** URL API per accedere al file */
  url: string;
  /** Dimensione file in byte */
  size: number;
  /** Tipo MIME rilevato */
  mimeType: string;
}

/**
 * Mappatura delle estensioni file ai tipi MIME.
 * Usata per gli header content-type quando si servono i file.
 */
const MIME_TYPES: Record<string, string> = {
  // Immagini
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  // Video
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".avi": "video/x-msvideo",
  ".webm": "video/webm",
  ".mkv": "video/x-matroska",
  // Audio
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  // Documenti
  ".pdf": "application/pdf",
};

// ============================================================================
// FUNZIONI DI UTILITÀ
// ============================================================================

/**
 * Assicura che una directory esista, creandola se necessario.
 *
 * @param dirPath - Percorso assoluto alla directory
 */
function ensureDir(dirPath: string): void {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Genera un nome file univoco usando UUID.
 *
 * @param originalName - Nome file originale con estensione
 * @returns Un nuovo nome file univoco che preserva l'estensione originale
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
 * Determina il tipo MIME basandosi sull'estensione del file.
 *
 * @param filename - Nome file con estensione
 * @returns Il tipo MIME corrispondente, o 'application/octet-stream' se sconosciuto
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
 * Costruisce il percorso filesystem assoluto per un file.
 *
 * @param category - La categoria media
 * @param entityId - L'ID dell'entità (utente, post, storia, messaggio)
 * @param filename - Il nome univoco del file
 * @returns Percorso assoluto al file
 */
function buildAbsolutePath(
  category: MediaCategory,
  entityId: string | number,
  filename: string
): string {
  return join(UPLOADS_DIR, category, String(entityId), filename);
}

/**
 * Costruisce il percorso della directory per un'entità.
 *
 * @param category - La categoria media
 * @param entityId - L'ID dell'entità
 * @returns Percorso assoluto alla directory dell'entità
 */
function buildEntityDir(
  category: MediaCategory,
  entityId: string | number
): string {
  return join(UPLOADS_DIR, category, String(entityId));
}

// ============================================================================
// OPERAZIONI SUI FILE
// ============================================================================

/**
 * Salva un file nel sistema di archiviazione.
 *
 * Genera un nome file univoco per prevenire collisioni e organizza
 * il file per categoria e ID entità.
 *
 * @param buffer - Il contenuto del file come Buffer
 * @param originalName - Nome file originale (usato per rilevare l'estensione)
 * @param category - Dove salvare il file (profiles, posts, stories, messages)
 * @param entityId - L'ID dell'entità correlata (userId, postId, storyId, messageId)
 * @returns Risultato upload con filename, path, URL, size e MIME type
 *
 * @example
 * // Salva un'immagine di un post
 * const result = saveFile(imageBuffer, 'vacation.jpg', 'posts', postId);
 * // result.url = '/api/media/posts/123/abc-uuid.jpg'
 *
 * @example
 * // Salva un'immagine profilo
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

  // Scrivi il file su disco
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
 * Legge un file dall'archiviazione.
 *
 * @param category - La categoria media
 * @param entityId - L'ID dell'entità correlata
 * @param filename - Il nome file univoco
 * @returns Contenuto del file come Buffer, o null se il file non esiste
 *
 * @example
 * const buffer = readFile('posts', 123, 'abc-uuid.jpg');
 * if (buffer) {
 *   // Elabora il file
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
 * Elimina un singolo file dall'archiviazione.
 *
 * @param category - La categoria media
 * @param entityId - L'ID dell'entità correlata
 * @param filename - Il nome file univoco
 * @returns true se il file è stato eliminato, false se non esisteva
 *
 * @example
 * const deleted = deleteFile('posts', 123, 'abc-uuid.jpg');
 * if (deleted) {
 *   console.log('File rimosso con successo');
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
 * Elimina tutti i file per un'entità.
 *
 * Utile quando si elimina un post, storia o account utente.
 * Rimuove l'intera directory dell'entità e tutti i suoi contenuti.
 *
 * @param category - La categoria media
 * @param entityId - L'ID dell'entità per cui eliminare i file
 * @returns true se la directory è stata eliminata, false se non esisteva
 *
 * @example
 * // Quando si elimina un post, rimuovi tutti i suoi media
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
 * Elenca tutti i file per un'entità.
 *
 * @param category - La categoria media
 * @param entityId - L'ID dell'entità
 * @returns Array di nomi file, o array vuoto se la directory non esiste
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
 * Ottiene il percorso filesystem assoluto per un file.
 *
 * @param category - La categoria media
 * @param entityId - L'ID dell'entità correlata
 * @param filename - Il nome file univoco
 * @returns Percorso assoluto se il file esiste, null altrimenti
 *
 * @example
 * const path = getFilePath('posts', 123, 'abc-uuid.jpg');
 * // Restituisce: 'C:/project/data/uploads/posts/123/abc-uuid.jpg'
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
 * Verifica se un file esiste nell'archiviazione.
 *
 * @param category - La categoria media
 * @param entityId - L'ID dell'entità correlata
 * @param filename - Il nome file univoco
 * @returns true se il file esiste, false altrimenti
 *
 * @example
 * if (fileExists('profiles', userId, 'avatar.jpg')) {
 *   // Il file è disponibile
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
