/**
 * @fileoverview Pagina Impostazioni Privacy Account
 * 
 * Permette all'utente di gestire le impostazioni di privacy:
 * - Account pubblico/privato
 * - Visibilità dei contenuti
 * - Chi può vedere le storie
 * 
 * Route: /accounts/privacy
 * 
 * @module app/(main)/accounts/privacy/page
 */

import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { profileRepository } from '@/repositories';
import { AccountPrivacyForm } from '@/components/settings';

// ============================================================================
// COMPONENTE PAGINA
// ============================================================================

/**
 * AccountPrivacyPage - Pagina impostazioni privacy
 * 
 * Server Component che recupera il profilo tramite repository
 * e renderizza il form delle impostazioni privacy.
 * 
 * @returns Pagina impostazioni privacy
 */
export default async function AccountPrivacyPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const profile = await profileRepository.findByUserId(user.id);

  if (!profile) {
    redirect('/login');
  }

  return <AccountPrivacyForm profile={profile} />;
}
