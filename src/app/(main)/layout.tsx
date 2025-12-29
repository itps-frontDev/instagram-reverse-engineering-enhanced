/**
 * @fileoverview Layout principale dell'applicazione Instagram.
 * 
 * Questo layout viene applicato a tutte le pagine all'interno del gruppo (main),
 * fornendo la sidebar di navigazione e la struttura generale della UI.
 */

import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[var(--bg-secondary)]">
      {/* Desktop Sidebar - nascosta su mobile */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-[80px] xl:ml-[336px] pb-16 lg:pb-0 min-h-screen flex items-start justify-center 2xl:pr-[352px] transition-all duration-300">
        <div className="w-full max-w-[710px] px-4">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation - nascosta su desktop */}
      <MobileNav />
    </div>
  );
}
