/**
 * @fileoverview Pagina Informazioni Personali Account
 * 
 * Permette all'utente di gestire le informazioni personali:
 * - Nome completo
 * - Dati anagrafici
 * - Informazioni di contatto aggiuntive
 * 
 * Route: /accounts/personal
 * 
 * @module app/(main)/accounts/personal/page
 */

import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { profileRepository } from '@/repositories';
import { PersonalInfoForm } from '@/components/settings';

// ============================================================================
// COMPONENTE PAGINA
// ============================================================================

/**
 * PersonalAccountPage - Pagina informazioni personali
 * 
 * Server Component che recupera il profilo tramite repository
 * e renderizza il form delle informazioni personali.
 * 
 * @returns Pagina informazioni personali
 */
export default async function PersonalAccountPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const profile = await profileRepository.findByUserId(user.id);

  if (!profile) {
    redirect('/login');
  }

  return <PersonalInfoForm profile={profile} />;
}
