/**
 * @fileoverview Pagina Dettaglio Post - Visualizzazione singolo post
 * 
 * Questa pagina mostra un singolo post con tutti i suoi dettagli:
 * - Immagine/video del post
 * - Didascalia e informazioni autore
 * - Commenti completi
 * - Interazioni (like, salva, commenta)
 * 
 * Route: /p/[postId]
 * 
 * @module app/(main)/p/[postId]/page
 */

'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Post from '@/components/feed/Post';
import { LoadingSpinner } from '@/components/common';
import type { FeedPost } from '@/types/feed';
import { toggleLikeAction } from '@/features/likes';
import { togglePostSaveAction } from '@/features/posts';

// ============================================================================
// INTERFACCE
// ============================================================================

/**
 * Props della pagina post
 * 
 * Next.js 15+ passa i params come Promise per supportare
 * il rendering parallelo e lo streaming.
 */
interface PostPageProps {
  /** Parametri della route (postId) - Promise per Next.js 15+ */
  params: Promise<{
    postId: string;
  }>;
}

// ============================================================================
// COMPONENTE PRINCIPALE
// ============================================================================

/**
 * PostPage - Pagina dettaglio singolo post
 * 
 * Carica e visualizza un post specifico identificato dall'ID nella URL.
 * Gestisce stati di caricamento ed errore, e fornisce le callback
 * per le interazioni utente (like, save, comment).
 * 
 * @param props - Props con i parametri della route
 * @returns Componente pagina post
 */
export default function PostPage({ params }: PostPageProps) {
  // ==========================================================================
  // PARAMS E NAVIGATION
  // ==========================================================================

  /** Estrae postId dai parametri della route */
  const { postId } = use(params);
  
  /** Router per navigazione programmatica */
  const router = useRouter();

  // ==========================================================================
  // STATE
  // ==========================================================================

  /** Dati del post caricato */
  const [post, setPost] = useState<FeedPost | null>(null);
  
  /** Flag: caricamento in corso */
  const [isLoading, setIsLoading] = useState(true);
  
  /** Messaggio di errore se presente */
  const [error, setError] = useState<string | null>(null);

  // ==========================================================================
  // EFFECTS - Caricamento Post
  // ==========================================================================

  /**
   * Effect: Carica il post dall'API al mount o al cambio di postId
   */
  useEffect(() => {
    const fetchPost = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/posts/${postId}`);
        
        // Gestione errori HTTP
        if (!response.ok) {
          if (response.status === 404) {
            setError('Post non trovato');
          } else {
            setError('Errore nel caricamento del post');
          }
          return;
        }

        const data = await response.json();
        setPost(data.post);
      } catch (err) {
        console.error('Errore fetch post:', err);
        setError('Errore nel caricamento del post');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [postId]);

  // ==========================================================================
  // RENDER - Stati di Caricamento e Errore
  // ==========================================================================

  // Stato: caricamento in corso
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  // Stato: errore o post non trovato
  if (error || !post) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-gray-500">{error || 'Post non trovato'}</p>
        <button
          onClick={() => router.push('/')}
          className="text-blue-500 hover:text-blue-600 font-semibold"
        >
          Torna alla home
        </button>
      </div>
    );
  }

  // ==========================================================================
  // HANDLERS - Interazioni Post
  // ==========================================================================

  /**
   * Gestisce il like/unlike del post
   * 
   * @param postId - ID del post
   */
  const handleLike = async (postId: number) => {
    const result = await toggleLikeAction({ likeableType: 'post', likeableId: postId });
    if (!result.success) {
      console.error('Errore like post:', result.error);
      return;
    }
    setPost(prev => prev
      ? { ...prev, is_liked_by_current_user: result.data.liked, likes_count: result.data.count }
      : prev
    );
  };

  /**
   * Gestisce il salvataggio/rimozione dai salvati del post
   * 
   * @param postId - ID del post
   */
  const handleSave = async (postId: number) => {
    try {
      const result = await togglePostSaveAction({ postId });
      if (!result.success) {
        throw new Error(result.error);
      }
      setPost(prev => prev
        ? { ...prev, is_saved_by_current_user: result.data.saved }
        : prev
      );
    } catch (error) {
      console.error('Errore salvataggio post:', error);
    }
  };

  /**
   * Gestisce l'invio di un nuovo commento
   * 
   * @param postId - ID del post
   * @param text - Testo del commento
   */
  const handleComment = async (postId: number, text: string) => {
    try {
      const response = await fetch(`/api/feed/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postId, text }),
      });
      if (response.ok) {
        const data = await response.json();
        setPost(data.post);
      }
    } catch (error) {
      console.error('Errore invio commento:', error);
    }
  };

  // ==========================================================================
  // RENDER - Contenuto Principale
  // ==========================================================================

  return (
    <div className="max-w-[630px] mx-auto pt-8 pb-16">
      {/* ------------------------------------------------------------------ */}
      {/* Componente Post con tutte le interazioni */}
      {/* ------------------------------------------------------------------ */}
      <Post
        post={post}
        onLike={handleLike}
        onSave={handleSave}
        onComment={handleComment}
      />
    </div>
  );
}
