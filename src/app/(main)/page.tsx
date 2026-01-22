/**
 * @fileoverview Homepage/Feed principale di Instagram.
 * 
 * Pagina principale dell'applicazione che mostra il feed dei post
 * degli utenti seguiti, le storie e i suggerimenti.
 * 
 * STRUTTURA:
 * - MobileSearchBar: barra di ricerca (solo mobile)
 * - Stories: carosello delle storie degli utenti seguiti
 * - FeedContainer: lista dei post con infinite scroll
 * - Suggestions: suggerimenti di profili da seguire (solo desktop XL)
 * 
 * LAYOUT:
 * - Contenuto centrato con larghezza massima 470px
 * - Offset negativo per compensare la sidebar su desktop
 * 
 * @module app/(main)/page
 */

import Stories from '@/components/feed/Stories';
import FeedContainer from '@/components/feed/FeedContainer';
import Suggestions from '@/components/feed/Suggestions';
import MobileSearchBar from '@/components/feed/MobileSearchBar';

// ============================================================================
// COMPONENTE PAGINA
// ============================================================================

/**
 * Pagina homepage/feed principale.
 * 
 * Mostra il feed dei post in ordine cronologico inverso,
 * con storie in alto e suggerimenti nella sidebar.
 * 
 * @returns Pagina del feed con storie, post e suggerimenti
 */
export default function HomePage() {
  return (
    <div className="w-full min-h-screen">
      {/* Barra di ricerca mobile - visibile solo su schermi piccoli */}
      <MobileSearchBar />
      
      <div className="w-full flex items-start justify-center lg:-ml-[40px] xl:-ml-[190px]">
        {/* Contenitore principale centrato */}
        <div className="w-full max-w-[470px] mx-auto max-[639px]:px-0">
          {/* Carosello storie */}
          <Stories />
          
          {/* Lista post con infinite scroll */}
          <FeedContainer />
        </div>
      </div>
      
      {/* Sidebar suggerimenti (visibile solo su desktop XL) */}
      <Suggestions />
    </div>
  );
}

