/**
 * @fileoverview API Media Server
 * 
 * Serve file multimediali (immagini, video) con controllo accessi.
 * 
 * STRUTTURA URL:
 * /api/media/[category]/[entityId]/[filename]
 * - category: 'profiles', 'posts', 'stories', 'messages'
 * - entityId: ID dell'entità correlata (user, post, etc.)
 * - filename: Nome univoco del file (UUID + estensione)
 * 
 * SICUREZZA:
 * - I file NON sono divisi in cartelle pubbliche/private
 * - Il controllo accessi avviene via database a runtime
 * - Validazione path per prevenire directory traversal
 * - Cache aggressiva (file hanno UUID univoci e immutabili)
 * 
 * ESEMPI:
 * - GET /api/media/posts/123/abc-uuid.jpg → Immagine post
 * - GET /api/media/profiles/456/xyz-uuid.png → Immagine profilo
 * - GET /api/media/stories/789/video-uuid.mp4 → Video storia
 * 
 * @module api/media
 */

import { NextRequest, NextResponse } from "next/server";
import { readFile, getMimeType, type MediaCategory } from "@/lib/storage";
import { queryOne } from "@/lib/db";
import { getCurrentProfile } from "@/lib/auth";

// ============================================================================
// CONFIGURAZIONE
// ============================================================================

/**
 * Categorie media valide.
 * Ogni categoria corrisponde a una cartella in data/uploads/.
 */
const VALID_CATEGORIES: MediaCategory[] = ["profiles", "posts", "stories", "messages"];

/**
 * Durata cache per i file statici.
 * 1 anno = 31536000 secondi.
 * 
 * STRATEGIA CACHE:
 * - File identificati da UUID univoco nel nome → non cambiano mai → cache immutabile
 * - Browser può salvare in locale senza rivalidare (immutable directive)
 * - CDN/Proxy possono cachare aggressivamente (public directive)
 * - Risparmio banda: ~90% delle richieste servite da cache locale
 * 
 * VANTAGGI:
 * - Latenza ridotta: file serviti da memoria browser
 * - Carico server ridotto: meno richieste al filesystem
 * - Banda risparmiata: nessun re-download per utenti ricorrenti
 * 
 * NOTA: Se file deve essere aggiornato, cambiare UUID nel nome.
 * Non modificare mai file esistenti, crearne di nuovi con UUID diverso.
 */
const CACHE_MAX_AGE = 31536000;

// ============================================================================
// ROUTE HANDLER
// ============================================================================

/**
 * GET /api/media/[category]/[entityId]/[filename]
 * 
 * Serve un file multimediale dal filesystem.
 * 
 * FLUSSO:
 * 1. Validazione parametri path
 * 2. Controllo accessi e autorizzazione
 * 3. Lettura file da disco
 * 4. Risposta con header cache e content-type
 * 
 * @param request - Richiesta HTTP
 * @param params - Parametri dinamici della route ([...path])
 * @returns File content o errore
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
  const { path } = await params;

  // ==========================================================================
  // VALIDAZIONE PATH
  // ==========================================================================

  // Verifica struttura: [category]/[entityId]/[filename]
  if (!path || path.length < 3) {
    return NextResponse.json(
      { error: "Path non valido. Formato: /api/media/[category]/[entityId]/[filename]" },
      { status: 400 }
    );
  }

  const [category, entityId, filename] = path;

  // Valida categoria (deve essere una di quelle supportate)
  if (!VALID_CATEGORIES.includes(category as MediaCategory)) {
    return NextResponse.json(
      { error: `Categoria non valida. Valori ammessi: ${VALID_CATEGORIES.join(", ")}` },
      { status: 400 }
    );
  }

  // Valida entityId (deve essere numero o stringa senza caratteri pericolosi)
  // Previene directory traversal (../)
  if (!entityId || entityId.includes("..")) {
    return NextResponse.json(
      { error: "Entity ID non valido" },
      { status: 400 }
    );
  }

  // Valida filename (previene path traversal)
  // Blocca: ../, ..\, /, \
  if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
    return NextResponse.json(
      { error: "Nome file non valido" },
      { status: 400 }
    );
  }

  // ==========================================================================
  // AUTORIZZAZIONE
  // ==========================================================================

  // Ottieni profilo autenticato (null se non loggato)
  const currentProfile = await getCurrentProfile();

  // Controllo accessi basato su categoria
  try {
    switch (category) {
      // ----------------------------------------------------------------------
      // POSTS: Verifica privacy profilo autore
      // ----------------------------------------------------------------------
      case "posts": {
        // Recupera post e profilo autore in una query JOIN
        const postData = await queryOne<{ profile_id: number; is_private: number }>(
          `SELECT p.profile_id, pr.is_private
           FROM posts p
           INNER JOIN profiles pr ON pr.id = p.profile_id
           WHERE p.id = ? AND p.deleted_at IS NULL AND pr.deleted_at IS NULL`,
          [entityId]
        );

        // Post non esiste o cancellato
        if (!postData) {
          return NextResponse.json(
            { error: "Post non trovato" },
            { status: 404 }
          );
        }

        // Se profilo privato, verifica accesso
        if (postData.is_private) {
          // Utente non autenticato → nessun accesso a contenuti privati
          if (!currentProfile) {
            return NextResponse.json(
              { error: "Autenticazione richiesta per visualizzare contenuti privati" },
              { status: 401 }
            );
          }

          // Proprietario del post → sempre accesso
          if (postData.profile_id === currentProfile.id) {
            break; // OK, continua
          }

          // Verifica follow accepted
          const isFollower = await queryOne<{ id: number }>(
            `SELECT id FROM follows
             WHERE follower_profile_id = ?
               AND following_profile_id = ?
               AND status = 'accepted'
               AND deleted_at IS NULL`,
            [currentProfile.id, postData.profile_id]
          );

          // Non follower → accesso negato
          if (!isFollower) {
            return NextResponse.json(
              { error: "Devi seguire questo account per vedere i suoi contenuti" },
              { status: 403 }
            );
          }
        }

        // Post pubblico o utente autorizzato
        break;
      }

      // ----------------------------------------------------------------------
      // STORIES: Verifica privacy + scadenza
      // ----------------------------------------------------------------------
      case "stories": {
        const storyData = await queryOne<{
          profile_id: number;
          is_private: number;
          expires_at: string;
        }>(
          `SELECT s.profile_id, pr.is_private, s.expires_at
           FROM stories s
           INNER JOIN profiles pr ON pr.id = s.profile_id
           WHERE s.id = ? AND s.deleted_at IS NULL AND pr.deleted_at IS NULL`,
          [entityId]
        );

        if (!storyData) {
          return NextResponse.json(
            { error: "Storia non trovata" },
            { status: 404 }
          );
        }

        // Verifica scadenza (24h da creazione)
        const now = new Date();
        const expiresAt = new Date(storyData.expires_at);
        if (now > expiresAt) {
          return NextResponse.json(
            { error: "Storia scaduta" },
            { status: 410 } // 410 Gone
          );
        }

        // Se profilo privato, stessi controlli dei post
        if (storyData.is_private) {
          if (!currentProfile) {
            return NextResponse.json(
              { error: "Autenticazione richiesta" },
              { status: 401 }
            );
          }

          if (storyData.profile_id !== currentProfile.id) {
            const isFollower = await queryOne<{ id: number }>(
              `SELECT id FROM follows
               WHERE follower_profile_id = ?
                 AND following_profile_id = ?
                 AND status = 'accepted'
                 AND deleted_at IS NULL`,
              [currentProfile.id, storyData.profile_id]
            );

            if (!isFollower) {
              return NextResponse.json(
                { error: "Accesso negato" },
                { status: 403 }
              );
            }
          }
        }

        break;
      }

      // ----------------------------------------------------------------------
      // MESSAGES: Verifica partecipazione chat
      // ----------------------------------------------------------------------
      case "messages": {
        // Autenticazione obbligatoria per messaggi
        if (!currentProfile) {
          return NextResponse.json(
            { error: "Autenticazione richiesta" },
            { status: 401 }
          );
        }

        // Verifica che il profilo corrente sia partecipante della chat
        // entityId qui è chat_id
        const isParticipant = await queryOne<{ id: number }>(
          `SELECT id FROM chat_participants
           WHERE chat_id = ? AND profile_id = ? AND deleted_at IS NULL`,
          [entityId, currentProfile.id]
        );

        if (!isParticipant) {
          return NextResponse.json(
            { error: "Non sei partecipante di questa conversazione" },
            { status: 403 }
          );
        }

        break;
      }

      // ----------------------------------------------------------------------
      // PROFILES: Immagini profilo sempre pubbliche
      // ----------------------------------------------------------------------
      case "profiles": {
        // Le immagini profilo sono SEMPRE pubbliche su Instagram,
        // indipendentemente dal setting is_private del profilo.
        // Solo i contenuti (post, storie) sono privati.
        
        // Verifica solo che il profilo esista e non sia cancellato
        const profileExists = await queryOne<{ id: number }>(
          `SELECT id FROM profiles WHERE id = ? AND deleted_at IS NULL`,
          [entityId]
        );

        if (!profileExists) {
          return NextResponse.json(
            { error: "Profilo non trovato" },
            { status: 404 }
          );
        }

        // Immagine profilo accessibile a tutti
        break;
      }

      default:
        // Categoria non gestita (non dovrebbe mai succedere per validazione precedente)
        return NextResponse.json(
          { error: "Categoria non supportata" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("[Media] Errore controllo autorizzazione:", error);
    return NextResponse.json(
      { error: "Errore nel controllo dei permessi" },
      { status: 500 }
    );
  }

  // ==========================================================================
  // RECUPERO FILE
  // ==========================================================================

  // Leggi file dal filesystem
  const fileBuffer = readFile(category as MediaCategory, entityId, filename);

  // Verifica esistenza file
  if (!fileBuffer) {
    return NextResponse.json(
      { error: "File non trovato" },
      { status: 404 }
    );
  }

  // Determina MIME type dall'estensione
  const contentType = getMimeType(filename);

  // ==========================================================================
  // RISPOSTA HTTP
  // ==========================================================================

  // Converti Buffer in Uint8Array (compatibilità NextResponse)
  const uint8Array = new Uint8Array(fileBuffer);

  return new NextResponse(uint8Array, {
    status: 200,
    headers: {
      // MIME type determinato da estensione file
      "Content-Type": contentType,
      
      // Dimensione esatta in bytes (utile per progress bar)
      "Content-Length": fileBuffer.length.toString(),
      
      // CACHE STRATEGY:
      // - public: può essere cachato da browser E proxy/CDN
      // - max-age=31536000: valido per 1 anno
      // - immutable: browser non rivalidare mai (file UUID-based non cambia)
      "Cache-Control": `public, max-age=${CACHE_MAX_AGE}, immutable`,
      
      // SECURITY:
      // - nosniff: browser usa solo Content-Type dichiarato
      // - Previene attacchi MIME confusion (es. eseguire .jpg come .js)
      "X-Content-Type-Options": "nosniff",
    },
  });
}
