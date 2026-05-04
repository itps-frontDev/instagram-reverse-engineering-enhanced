/**
 * @fileoverview Layout principale dell'applicazione Instagram.
 * 
 * Questo layout viene applicato a tutte le pagine all'interno del gruppo (main),
 * fornendo la sidebar di navigazione e la struttura generale della UI.
 * 
 * STRUTTURA:
 * - InstagramLoadingBar: barra di caricamento in stile Instagram
 * - Sidebar: navigazione laterale (desktop)
 * - Main Content: area principale dove vengono renderizzate le pagine
 * - MobileNav: navigazione inferiore (mobile)
 * 
 * RESPONSIVE:
 * - Mobile (<1024px): navigazione bottom, contenuto full-width
 * - Desktop (>=1024px): sidebar compressa (80px)
 * - Desktop XL (>=1280px): sidebar espansa (336px)
 * 
 * @module app/(main)/layout
 */

import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';
import { InstagramLoadingBar } from '@/components/common';

// ============================================================================
// COMPONENTE LAYOUT
// ============================================================================

/**
 * Layout principale per le pagine autenticate.
 * 
 * Gestisce la struttura responsive dell'applicazione con sidebar
 * su desktop e navigazione bottom su mobile.
 * 
 * @param children - Contenuto della pagina corrente
 * @returns Layout con navigazione e area contenuto
 */
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Barra di caricamento in stile Instagram (top of page) */}
      <InstagramLoadingBar />
      
      {/* Sidebar desktop - nascosta su mobile (<1024px) */}
      <Sidebar />

      {/* Area contenuto principale */}
      <main className="flex-1 lg:ml-[80px] xl:ml-[336px] pb-16 lg:pb-0 min-h-screen transition-all duration-300 overflow-x-hidden">
        {children}
      </main>

      {/* Navigazione mobile (bottom) - nascosta su desktop (>=1024px) */}
      <MobileNav />
    </div>
  );
}

