/**
 * @fileoverview API per la creazione di nuovi post
 *
 * POST /api/posts/create
 * Crea un nuovo post con immagini, caption e altre opzioni.
 * 
 * PATTERN REPOSITORY:
 * Usa PostRepository e ProfileRepository per accesso ai dati.
 * Usa withTransaction per garantire atomicità delle operazioni.
 *
 * @module api/posts/create
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth';
import { withTransaction } from '@/lib/db';
import { saveFile } from '@/lib/storage';
import { postRepository, profileRepository } from '@/repositories';

export const runtime = 'nodejs';

interface CreatePostRequest {
  images: string[]; // immagini codificate in base64
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
    // 1. Verifica autenticazione
    const currentProfile = await getCurrentProfile();
    if (!currentProfile) {
      return NextResponse.json(
        { success: false, error: 'Non autorizzato' },
        { status: 401 }
      );
    }

    // 2. Parsing del body
    const body: CreatePostRequest = await request.json();
    const { images, caption, location, isCommentsDisabled, isLikesHidden } = body;

    // 3. Validazione immagini
    if (!images || images.length === 0) {
      return NextResponse.json(
        { success: false, error: `Almeno un\'immagine è richiesta` },
        { status: 400 }
      );
    }

    if (images.length > 10) {
      return NextResponse.json(
        { success: false, error: 'Massimo 10 immagini consentite' },
        { status: 400 }
      );
    }

    // 4. Esegui creazione in transazione atomica
    const postId = await withTransaction(async () => {
      // 5. Crea il record del post tramite repository
      const postId = await postRepository.create({
        profile_id: currentProfile.id,
        caption: caption?.trim() || undefined,
        location: location?.trim() || undefined,
        comments_disabled: isCommentsDisabled,
        is_likes_hidden: isLikesHidden,
      });

      // 6. Salva le immagini e crea i record post_media
      for (let i = 0; i < images.length; i++) {
        const base64Image = images[i];
        
        // Estrai dati base64 (rimuove prefisso data:image/...;base64,)
        const matches = base64Image.match(/^data:image\/(\w+);base64,(.+)$/);
        if (!matches) {
          throw new Error(`Formato immagine non valido alla posizione ${i}`);
        }

        const imageExtension = matches[1]; // jpeg, png, etc.
        const base64Data = matches[2];
        
        // Converti base64 in buffer
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Genera nome file
        const filename = `image-${i}.${imageExtension}`;
        
        // Salva file nello storage
        const saveResult = saveFile(buffer, filename, 'posts', postId);
        
        // Crea record post_media tramite repository
        await postRepository.addMedia({
          post_id: postId,
          media_url: saveResult.url,
          media_type: 'image',
          position: i,
        });
      }

      // 7. Incrementa contatore post del profilo tramite repository
      await profileRepository.incrementPostsCount(currentProfile.id);

      return postId;
    });

    const response: CreatePostResponse = {
      success: true,
      postId,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('[Create Post] Errore:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Errore interno del server' 
      },
      { status: 500 }
    );
  }
}
