/**
 * @fileoverview Stato vuoto per le sezioni del profilo.
 *
 * Componente che mostra un messaggio appropriato quando una sezione
 * del profilo non ha contenuti da visualizzare. Il messaggio e l'icona
 * cambiano in base al tab attivo e se è il profilo dell'utente corrente.
 * 
 * STATI SUPPORTATI:
 * - posts: "Condividi foto" (proprio) / "Ancora nessun post" (altri)
 * - reels: "Condividi reel" (proprio) / "Nessun reel ancora" (altri)
 * - saved: "Salva" con spiegazione sulla privacy (solo proprio profilo)
 * - tagged: "Foto in cui ci sei tu" (proprio) / "Nessuna foto" (altri)
 * 
 * LAYOUT:
 * - Tab "saved": layout speciale con header "Solo tu puoi vedere..."
 * - Altri tab: layout centrato con icona, titolo e messaggio
 * 
 * INTERAZIONI:
 * - Nel proprio profilo, l'icona dei post è cliccabile per creare un nuovo post
 * - Link "Condividi la tua prima foto" per guidare l'utente
 * 
 * @module components/profile/ProfileEmptyState
 */

'use client';

import { ProfileTab } from '@/types/profile';
import PostsEmptyIcon from './icons/PostsEmptyIcon';
import TaggedEmptyIcon from './icons/TaggedEmptyIcon';
import SavedEmptyIcon from './icons/SavedEmptyIcon';

// ============================================================================
// INTERFACCE
// ============================================================================

/**
 * Props per il componente ProfileEmptyState.
 * 
 * @interface ProfileEmptyStateProps
 */
export interface ProfileEmptyStateProps {
  /** Tab attualmente selezionato */
  tab: ProfileTab;
  /** Se true, è il profilo dell'utente corrente */
  isOwnProfile: boolean;
  /** Callback per aprire il modal di creazione post */
  onCreatePost?: () => void;
}

// ============================================================================
// COMPONENTE
// ============================================================================

/**
 * ProfileEmptyState - Messaggio per sezioni vuote del profilo.
 * 
 * Mostra un'icona, un titolo e un messaggio contestuale basato su:
 * - Quale tab è attivo (posts, reels, saved, tagged)
 * - Se l'utente sta guardando il proprio profilo o quello di altri
 * 
 * @param props - Props del componente
 * @returns Stato vuoto con icona, titolo e messaggio
 */
export default function ProfileEmptyState({
  tab,
  isOwnProfile,
  onCreatePost,
}: ProfileEmptyStateProps) {
  // ==========================================================================
  // CONFIGURAZIONE STATI
  // ==========================================================================
  
  /**
   * Mappa di configurazione per ogni possibile stato vuoto.
   * Ogni stato definisce: icona, titolo, messaggio e azione opzionale.
   * I testi cambiano se è il proprio profilo o quello di qualcun altro.
   */
  const emptyStates = {
    posts: {
      icon: <PostsEmptyIcon />,
      title: isOwnProfile ? 'Condividi foto' : 'Ancora nessun post',
      message: isOwnProfile
        ? 'Quando condividi le foto, saranno visualizzate sul tuo profilo.'
        : '',
      action: isOwnProfile ? (
        <button
          onClick={onCreatePost}
          className="text-[rgb(133,161,255)] font-semibold text-sm hover:underline transition-all"
        >
          Condividi la tua prima foto
        </button>
      ) : null,
    },
    reels: {
      icon: <PostsEmptyIcon />,
      title: isOwnProfile ? 'Condividi reel' : 'Nessun reel ancora',
      message: isOwnProfile
        ? 'Quando condividi i reel, saranno visualizzati sul tuo profilo.'
        : '',
      action: null,
    },
    saved: {
      icon: <SavedEmptyIcon />,
      title: 'Salva',
      message:
        'Salva le foto e i video che desideri rivedere. Nessuno riceverà una notifica e solo tu potrai vedere cosa hai salvato.',
      action: null,
    },
    tagged: {
      icon: <TaggedEmptyIcon />,
      title: isOwnProfile ? 'Foto in cui ci sei tu' : 'Nessuna foto',
      message: isOwnProfile
        ? 'Quando le persone ti taggano nelle foto, saranno visualizzate qui.'
        : '',
      action: null,
    },
  };

  const state = emptyStates[tab];

  // Fallback se il tab non è riconosciuto
  if (!state) {
    return null;
  }

  // ==========================================================================
  // RENDER - LAYOUT SPECIALE PER TAB "SAVED"
  // ==========================================================================

  /**
   * Il tab "saved" ha un layout diverso con:
   * - Header che spiega la privacy ("Solo tu puoi vedere...")
   * - Pulsante per creare nuova raccolta
   */
  if (tab === 'saved') {
    return (
      <div className="flex flex-col items-center w-full">
        {/* Header con info privacy e azione */}
        <div className="w-full max-w-[938px] flex items-center justify-between my-8">
          <span className="text-xs leading-4 text-[rgb(168,168,168)]">
            Solo tu puoi vedere gli elementi che hai salvato
          </span>
          <button className="text-[rgb(133,161,255)] font-semibold text-sm hover:underline transition-all">
            + Nuova raccolta
          </button>
        </div>

        {/* Stato vuoto centrato */}
        <div className="flex flex-col items-center justify-center text-center mx-auto max-w-[350px]">
          {/* Icona grande */}
          <div className="mb-6 flex items-center justify-center">
            {state.icon}
          </div>

          {/* Titolo principale */}
          <h1 className="text-[30px] font-extrabold leading-9 text-center break-words text-[#0C1014] dark:text-[#F5F5F5] mb-4">
            {state.title}
          </h1>

          {/* Messaggio esplicativo */}
          <span className="text-sm font-normal leading-[18px] text-center break-words text-[#0C1014] dark:text-[#F5F5F5] w-[350px] mb-4 block">
            {state.message}
          </span>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // RENDER - LAYOUT DEFAULT PER ALTRI TAB
  // ==========================================================================

  return (
    <div className="py-16 flex flex-col items-center justify-center text-center mx-auto max-w-[350px]">
      {/* 
        Icona dello stato vuoto.
        Per il tab "posts" nel proprio profilo, l'icona è cliccabile
        e apre il modal di creazione post.
      */}
      <div
        className={`mb-6 flex items-center justify-center ${
          isOwnProfile && tab === 'posts' ? 'cursor-pointer' : ''
        }`}
        onClick={isOwnProfile && tab === 'posts' ? onCreatePost : undefined}
        role={isOwnProfile && tab === 'posts' ? 'button' : undefined}
        tabIndex={isOwnProfile && tab === 'posts' ? 0 : undefined}
      >
        {state.icon}
      </div>

      {/* Titolo principale */}
      <h1 className="text-[30px] font-extrabold leading-9 text-center break-words text-[#0C1014] dark:text-[#F5F5F5] mb-4">
        {state.title}
      </h1>

      {/* Messaggio esplicativo */}
      <span className="text-sm font-normal leading-[18px] text-center break-words text-[#0C1014] dark:text-[#F5F5F5] w-[350px] mb-4 block">
        {state.message}
      </span>

      {/* Azione opzionale (es. "Condividi la tua prima foto") */}
      {state.action}
    </div>
  );
}
