/**
 * @fileoverview Barra di caricamento stile Instagram.
 * 
 * Barra di progresso animata mostrata in alto durante la navigazione.
 * Utilizza i colori gradient caratteristici di Instagram
 * (giallo -> rosso -> viola).
 * 
 * COMPORTAMENTO:
 * - Si attiva automaticamente al cambio di route
 * - Progresso simulato con animazione fluida
 * - Si nasconde dopo il completamento
 * 
 * @module components/common/InstagramLoadingBar
 */

'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

// ============================================================================
// COMPONENTE
// ============================================================================

/**
 * Barra di caricamento con gradient Instagram.
 * 
 * Si attiva automaticamente durante la navigazione tra pagine.
 * Mostra un progresso simulato per feedback visivo all'utente.
 * 
 * @returns Barra di caricamento o null se non attiva
 * 
 * @example
 * ```tsx
 * // Nel layout principale
 * <InstagramLoadingBar />
 * ```
 */
export default function InstagramLoadingBar() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    //Start caricamento con progresso simulato
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProgress(0);

    // Simula progresso (durata totale: 0.04s)
    const timer1 = setTimeout(() => setProgress(60), 10);
    // Completa caricamento
    const completeTimer = setTimeout(() => {
      setProgress(100);
      // Mantieni la barra visibile per 300ms dopo il 100%
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 300);
    }, 40);

    return () => {
      clearTimeout(timer1);
      clearTimeout(completeTimer);
    };
  }, [pathname]);

  if (!loading && progress === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 h-[3px] z-[9999] transition-opacity duration-200"
      style={{ opacity: loading ? 1 : 0 }}
    >
      <div
        className="h-full bg-gradient-to-r from-yellow-400 via-red-500 to-purple-600 transition-all duration-300 ease-out"
        style={{
          width: `${progress}%`,
          boxShadow: '0 0 10px rgba(255, 87, 34, 0.5)',
        }}
      />
    </div>
  );
}
