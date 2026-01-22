/**
 * @fileoverview Wrapper provider client-side.
 *
 * Avvolge l'applicazione con tutti i context provider necessari lato client.
 * 
 * PROVIDER INCLUSI:
 * - AuthProvider: Gestione autenticazione e sessione utente
 * 
 * @module components/Providers
 */

'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { ReactNode } from 'react';

// ============================================================================
// COMPONENTE
// ============================================================================

/**
 * Wrapper dei provider React.
 * 
 * Componente che racchiude l'albero React con i context provider
 * necessari per il funzionamento dell'applicazione.
 * 
 * @param props - Props con children da wrappare
 * @returns Albero React avvolto nei provider
 */
export default function Providers({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
