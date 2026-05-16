/**
 * @fileoverview Pagina Impostazioni Data di Nascita
 * 
 * Server Component che legge la data di nascita dal backend Spring Boot
 * tramite server action e renderizza il form.
 * 
 * Route: /accounts/birthday
 * 
 * @module app/(main)/(profile)/accounts/birthday/page
 */

import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getBirthdayAction } from '@/features/profile';
import { BirthdayForm } from '@/components/settings';

// Disabilita il caching - sempre fetch fresh dal backend
export const revalidate = 0;

/**
 * BirthdayPage - Server Component
 * 
 * Carica la data di nascita dal backend Spring Boot tramite getBirthdayAction()
 * e passa il valore al BirthdayForm client component.
 * 
 * @returns Pagina impostazioni data di nascita
 */
export default async function BirthdayPage() {
  // Verifica che l'utente sia autenticato
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch birthday data dal backend Spring Boot
  const result = await getBirthdayAction();

  if (!result.success) {
    // Se non riesce a leggere i dati, reindirizza a login
    redirect('/login');
  }

  return <BirthdayForm initialBirthday={result.data.birthday} />;
}
