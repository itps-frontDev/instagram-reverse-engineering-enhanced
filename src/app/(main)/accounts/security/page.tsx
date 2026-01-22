/**
 * @fileoverview Pagina Impostazioni Sicurezza
 * 
 * Permette all'utente di gestire le impostazioni di sicurezza:
 * - Cambio password
 * - Email associata all'account
 * - Numero di telefono
 * - Autenticazione a due fattori
 * 
 * Route: /accounts/security
 * 
 * @module app/(main)/accounts/security/page
 */

import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { userRepository } from '@/repositories';
import { SecurityForm } from '@/components/settings';

// ============================================================================
// COMPONENTE PAGINA
// ============================================================================

/**
 * SecurityPage - Pagina impostazioni sicurezza
 * 
 * Server Component che recupera i dati utente tramite repository
 * e renderizza il form delle impostazioni sicurezza.
 * 
 * @returns Pagina impostazioni sicurezza
 */
export default async function SecurityPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const userData = await userRepository.getSecurityData(user.id);

  if (!userData) {
    redirect('/login');
  }

  return <SecurityForm user={userData} />;
}
