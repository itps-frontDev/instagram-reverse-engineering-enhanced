/**
 * @fileoverview Account privacy settings page
 *
 * Two-column layout with settings sidebar and privacy settings form.
 */

import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { queryOne } from '@/lib/db';
import SettingsSidebar from '@/components/settings/SettingsSidebar';
import AccountPrivacyForm from '@/components/settings/AccountPrivacyForm';

interface Profile {
  id: number;
  username: string;
  is_private: number;
}

async function getProfile() {
  // Use the getCurrentUser utility which handles JWT verification correctly
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  try {
    // Fetch user profile from database
    const profile = await queryOne<Profile>(
      `SELECT id, username, is_private
       FROM profiles
       WHERE user_id = ? AND deleted_at IS NULL`,
      [user.id]
    );

    if (!profile) {
      redirect('/login');
    }

    return profile;
  } catch (err) {
    console.error('[AccountPrivacy] Error fetching profile:', err);
    redirect('/login');
  }
}

export default async function AccountPrivacyPage() {
  const profile = await getProfile();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <SettingsSidebar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center py-9 px-8">
        <div className="w-full max-w-xl">
          <AccountPrivacyForm profile={profile} />
        </div>
      </main>
    </div>
  );
}
