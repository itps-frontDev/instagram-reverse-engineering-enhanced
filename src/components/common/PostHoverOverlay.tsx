/**
 * @fileoverview Overlay hover per anteprime post.
 * 
 * Overlay semitrasparente che appare al passaggio del mouse su un post
 * nella griglia. Mostra i conteggi di like e commenti.
 * 
 * UTILIZZO:
 * - ProfileGrid: griglia post nel profilo utente
 * - ExploreGrid: griglia post nella sezione esplora
 * - Qualsiasi altra griglia di anteprime post
 * 
 * COMPORTAMENTO:
 * - Invisibile di default (opacity-0)
 * - Visibile al hover del contenitore padre (group-hover:opacity-100)
 * - Sfondo nero semitrasparente (40% opacità)
 * - Transizione fluida dell'opacità
 * 
 * NOTA: Il contenitore padre deve avere la classe "group" per
 * permettere l'attivazione dell'overlay al hover.
 * 
 * @module components/common/PostHoverOverlay
 * 
 * @example
 * ```tsx
 * <div className="group relative">
 *   <Image src={...} />
 *   <PostHoverOverlay likesCount={150} commentsCount={23} />
 * </div>
 * ```
 */

'use client';

import { Heart, MessageCircle } from 'lucide-react';

// ============================================================================
// INTERFACCE
// ============================================================================

/**
 * Props per il componente PostHoverOverlay.
 * 
 * @interface PostHoverOverlayProps
 */
interface PostHoverOverlayProps {
  /** Numero di like del post */
  likesCount: number;
  /** Numero di commenti del post */
  commentsCount: number;
  /** Se formattare i numeri grandi (es. 1500 → "1.5K") */
  formatNumbers?: boolean;
  /** Classe CSS aggiuntiva */
  className?: string;
}

// ============================================================================
// FUNZIONI UTILITY
// ============================================================================

/**
 * Formatta un numero in formato abbreviato per una migliore leggibilità.
 * 
 * Converte numeri grandi in formato compatto con suffissi K (migliaia)
 * e M (milioni) per risparmiare spazio nell'UI.
 * 
 * @param count - Numero da formattare
 * @returns Stringa formattata
 * 
 * @example
 * formatCount(500)      // "500"
 * formatCount(1500)     // "1.5K"
 * formatCount(2300000)  // "2.3M"
 */
function formatCount(count: number): string {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1)}M`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1)}K`;
  }
  return count.toString();
}

// ============================================================================
// COMPONENTE
// ============================================================================

/**
 * Overlay hover per anteprime post nelle griglie.
 * 
 * Mostra i conteggi di like e commenti sopra l'immagine del post
 * quando l'utente passa il mouse sopra. Richiede che il contenitore
 * padre abbia la classe "group" di Tailwind.
 * 
 * @param props - Props del componente
 * @returns Overlay con statistiche del post
 */
export default function PostHoverOverlay({
  likesCount,
  commentsCount,
  formatNumbers = false,
  className = '',
}: PostHoverOverlayProps) {
  // Formatta i numeri se richiesto, altrimenti mostra il valore grezzo
  const displayLikes = formatNumbers ? formatCount(likesCount) : likesCount;
  const displayComments = formatNumbers ? formatCount(commentsCount) : commentsCount;

  return (
    <div 
      className={`
        absolute inset-0 
        bg-black/40 
        opacity-0 group-hover:opacity-100 
        transition-opacity 
        flex items-center justify-center gap-6
        ${className}
      `}
    >
      {/* Contatore Like */}
      <div className="flex items-center gap-2 text-white font-semibold">
        <Heart className="w-6 h-6" fill="white" />
        <span>{displayLikes}</span>
      </div>

      {/* Contatore Commenti - icona specchiata per stile Instagram */}
      <div className="flex items-center gap-2 text-white font-semibold">
        <MessageCircle className="w-6 h-6 icon-mirrored" fill="white" />
        <span>{displayComments}</span>
      </div>
    </div>
  );
}
