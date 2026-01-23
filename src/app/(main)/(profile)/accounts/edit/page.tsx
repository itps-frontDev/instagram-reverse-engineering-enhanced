/**
 * @fileoverview Pagina Modifica Profilo
 * 
 * Permette all'utente di modificare le informazioni del proprio profilo:
 * - Username e nome completo
 * - Bio e sito web
 * - Immagine profilo
 * - Genere e informazioni personali
 * 
 * Route: /accounts/edit
 * 
 * @module app/(main)/accounts/edit/page
 */

import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { profileRepository } from '@/repositories';
import { EditProfileForm } from '@/components/settings';

// ============================================================================
// COMPONENTE PAGINA
// ============================================================================

/**
 * EditProfilePage - Pagina modifica profilo
 * 
 * Server Component che recupera il profilo tramite repository
 * e renderizza il form di modifica.
 * 
 * @returns Pagina modifica profilo
 */
export default async function EditProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const profile = await profileRepository.findByUserId(user.id);

  if (!profile) {
    redirect('/login');
  }

  return <EditProfileForm profile={profile} />;
}
