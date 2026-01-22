/**
 * @fileoverview Navigazione a tab per le sezioni del profilo.
 * 
 * Barra di tab orizzontale che permette di navigare tra le diverse
 * sezioni del profilo: Post, Reels, Salvati, Taggati.
 * 
 * VISIBILITÀ TAB:
 * - Post: sempre visibile per tutti i profili
 * - Reels: visibile solo se il profilo ha pubblicato almeno un reel
 * - Salvati: visibile solo nel proprio profilo (contenuto privato)
 * - Taggati: visibile se profilo pubblico, se lo segui, o se è il tuo
 * 
 * STILE:
 * - Icone centrate con indicatore attivo (linea sotto il tab)
 * - Max width 193px per tab, equidistribuiti
 * - Bordo inferiore grigio chiaro/scuro in base al tema
 * 
 * @module components/profile/ProfileTabs
 */

'use client';

import React from 'react';
import { ProfileTabsProps, ProfileTab } from '@/types/profile';
import { PostsTabIcon, SavedTabIcon, TaggedTabIcon, ReelsTabIcon  } from '@/components/profile/icons';

// ============================================================================
// COMPONENTE
// ============================================================================

/**
 * ProfileTabs - Navigazione a tab per il profilo.
 * 
 * Renderizza una barra di tab con icone. I tab mostrati dipendono da:
 * - Se è il proprio profilo (mostra "Salvati")
 * - Se il profilo ha reel (mostra "Reels")
 * - Se si può vedere il contenuto taggato (mostra "Taggati")
 * 
 * @param props - Props del componente (vedi ProfileTabsProps)
 * @returns Barra di navigazione con tab
 */
export default function ProfileTabs({
  activeTab,
  onTabChange,
  postsCount,
  showTagged,
  hasReels = false,
  canViewTagged = false,
}: ProfileTabsProps) {
  // ==========================================================================
  // CONFIGURAZIONE TAB
  // ==========================================================================
  
  /**
   * Array dei tab da mostrare.
   * Viene costruito dinamicamente in base alle condizioni di visibilità.
   * Ogni tab ha un ID (usato per la logica) e una funzione icon
   * che riceve lo stato attivo per cambiare aspetto.
   */
  const tabs: { id: ProfileTab; icon: (active: boolean) => React.ReactNode }[] = [
    // Tab Post - sempre visibile
    {
      id: 'posts',
      icon: (active) => <PostsTabIcon active={active} />,
    },
  ];

  // Aggiungi tab Reels se il profilo ha almeno un reel
  if (hasReels) {
    tabs.push({
      id: 'reels',
      icon: (active) => <ReelsTabIcon active={active} />,
    });
  }

  // Aggiungi tab Salvati solo per il proprio profilo
  // (showTagged è true solo per il proprio profilo in questo contesto)
  if (showTagged) {
    tabs.push({
      id: 'saved',
      icon: (active) => <SavedTabIcon active={active} />,
    });
  }

  // Aggiungi tab Taggati se:
  // - canViewTagged: profilo pubblico o lo si segue
  // - showTagged: è il proprio profilo
  if (canViewTagged || showTagged) {
    tabs.push({
      id: 'tagged',
      icon: (active) => <TaggedTabIcon active={active} />,
    });
  }

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div className="w-full flex justify-center gap-1 border-b border-[#DBDBDB] dark:border-[#2b3036]">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="relative flex items-center justify-center cursor-pointer appearance-none outline-none border-none bg-transparent h-11 flex-1"
            style={{ flexBasis: 0, maxWidth: '193px', width: '193px' }}
          >
            {/* Icona del tab (cambia colore se attivo) */}
            <span className="flex items-center justify-center h-11 w-11">
              {tab.icon(isActive)}
            </span>
            
            {/* Indicatore tab attivo - linea sotto l'icona */}
            {isActive && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-[2px] bg-[#262626] dark:bg-white" />
            )}
          </button>
        );
      })}
    </div>
  );
}
