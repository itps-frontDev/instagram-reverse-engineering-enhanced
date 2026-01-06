/**
 * @fileoverview Layout personalizzato per la pagina Reels.
 * 
 * Questo layout rimuove tutti i padding e permette al video
 * di occupare l'intero schermo senza barre grigie.
 */

import Sidebar from '@/components/layout/Sidebar';

export default function ReelsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      {/* Desktop Sidebar - nascosta su mobile */}
      <Sidebar />

      {/* Main Content Area - Full screen for reels */}
      <main className="min-h-screen bg-[var(--color-bg-primary)]">
        {children}
      </main>
    </div>
  );
}
