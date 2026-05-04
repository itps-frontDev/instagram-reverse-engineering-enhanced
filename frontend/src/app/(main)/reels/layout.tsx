/**
 * @fileoverview Layout personalizzato per la sezione Reels
 * 
 * Questo layout è ottimizzato per la visualizzazione video full-screen:
 * - Rimuove tutti i padding del layout standard
 * - Permette al video di occupare l'intero schermo
 * - Mantiene solo la Sidebar per la navigazione desktop
 * - Evita barre grigie o spazi vuoti attorno ai video
 * 
 * @module app/(main)/reels/layout
 */

import Sidebar from '@/components/layout/Sidebar';

// ============================================================================
// INTERFACCE
// ============================================================================

/**
 * Props per il layout Reels
 */
interface ReelsLayoutProps {
  /** Contenuto della pagina (page.tsx) */
  children: React.ReactNode;
}

// ============================================================================
// COMPONENTE LAYOUT
// ============================================================================

/**
 * ReelsLayout - Layout full-screen per i video reels
 * 
 * A differenza del layout principale, questo layout:
 * - Non ha padding sui contenuti
 * - Non ha margini laterali
 * - Permette al contenuto di espandersi a tutto schermo
 * 
 * @param props - Props del componente
 * @returns Layout wrapper per le pagine Reels
 */
export default function ReelsLayout({ children }: ReelsLayoutProps) {
  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      {/* ------------------------------------------------------------------ */}
      {/* Sidebar Desktop */}
      {/* Nascosta automaticamente su mobile tramite media queries interne */}
      {/* ------------------------------------------------------------------ */}
      <Sidebar />

      {/* ------------------------------------------------------------------ */}
      {/* Area Contenuto Principale */}
      {/* Full screen senza padding per esperienza video immersiva */}
      {/* ------------------------------------------------------------------ */}
      <main className="min-h-screen bg-[var(--color-bg-primary)]">
        {children}
      </main>
    </div>
  );
}
