/**
 * @fileoverview Pagina Impostazioni Data di Nascita
 * 
 * Permette all'utente di visualizzare e modificare la data di nascita:
 * - Visualizzazione data attuale
 * - Form per modifica (se consentito)
 * - Informazioni su perché la data è richiesta
 * 
 * Route: /accounts/birthday
 * 
 * @module app/(main)/accounts/birthday/page
 */

import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { userRepository } from '@/repositories';
import { BirthdayForm } from '@/components/settings';

// ============================================================================
// COMPONENTE PAGINA
// ============================================================================

/**
 * BirthdayPage - Pagina impostazioni data di nascita
 * 
 * Server Component che recupera i dati utente tramite repository
 * e renderizza il form per la data di nascita.
 * 
 * @returns Pagina impostazioni data di nascita
 */
export default async function BirthdayPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const userData = await userRepository.getBirthdayData(user.id);

  if (!userData) {
    redirect('/login');
  }

  return <BirthdayForm user={userData} />;
}
