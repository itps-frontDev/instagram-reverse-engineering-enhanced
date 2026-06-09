export const dynamic = 'force-dynamic';
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
import { EditProfileForm } from '@/components/settings';
import { getMeProfileAction } from '@/features/profile';

// ============================================================================
// COMPONENTE PAGINA
// ============================================================================

/**
 * EditProfilePage - Pagina modifica profilo
 * 
 * Server Component che recupera il profilo autenticato da Spring
 * e renderizza il form di modifica.
 * 
 * @returns Pagina modifica profilo
 */
export default async function EditProfilePage() {
  const profileResult = await getMeProfileAction();

  if (!profileResult.success || !profileResult.data) {
    redirect('/login');
  }

  return <EditProfileForm profile={profileResult.data} />;
}
