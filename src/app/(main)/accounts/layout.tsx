/**
 * @fileoverview Layout per le pagine Impostazioni Account
 * 
 * Layout condiviso per tutte le pagine di impostazioni che include:
 * - SettingsSidebar a sinistra (nascosta su mobile)
 * - Area contenuto principale con Footer
 * 
 * Questo layout centralizza la struttura comune evitando
 * duplicazione di codice nelle singole pagine.
 * 
 * @module app/(main)/accounts/layout
 */

import { SettingsSidebar } from '@/components/settings';
import { Footer } from '@/components/common';

// ============================================================================
// INTERFACCE
// ============================================================================

/**
 * Props per il layout accounts
 */
interface AccountsLayoutProps {
  /** Contenuto della pagina (page.tsx) */
  children: React.ReactNode;
}

// ============================================================================
// COMPONENTE LAYOUT
// ============================================================================

/**
 * AccountsLayout - Layout wrapper per le pagine impostazioni
 * 
 * Fornisce la struttura a due colonne con sidebar e area contenuto,
 * eliminando la duplicazione in ogni singola pagina.
 * 
 * @param props - Props del componente
 * @returns Layout con sidebar e area contenuto
 */
export default function AccountsLayout({ children }: AccountsLayoutProps) {
  return (
    <div className="flex min-h-screen">
      {/* ------------------------------------------------------------------ */}
      {/* Sidebar Impostazioni - Nascosta su mobile */}
      {/* ------------------------------------------------------------------ */}
      <div className="hidden lg:block">
        <SettingsSidebar />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Contenuto Principale */}
      {/* ------------------------------------------------------------------ */}
      <main className="flex-1 flex flex-col items-center py-9 px-8 max-[1023px]:py-4 max-[1023px]:px-4 max-[1023px]:w-full">
        <div className="w-full max-w-xl max-[1023px]:max-w-full">
          {children}
        </div>
        <Footer />
      </main>
    </div>
  );
}
