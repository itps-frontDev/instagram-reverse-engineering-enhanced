/**
 * @fileoverview Personal account settings page
 */

import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { queryOne } from '@/lib/db';
import SettingsSidebar from '@/components/settings/SettingsSidebar';
import PersonalInfoForm from '@/components/settings/PersonalInfoForm';
import Footer from '@/components/common/Footer';

interface Profile {
  id: number;
  username: string;
  full_name: string | null;
}

async function getProfile() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  try {
    const profile = await queryOne<Profile>(
      `SELECT id, username, full_name
       FROM profiles
       WHERE user_id = ? AND deleted_at IS NULL`,
      [user.id]
    );

    if (!profile) {
      redirect('/login');
    }

    return profile;
  } catch (err) {
    console.error('[PersonalAccount] Error fetching profile:', err);
    redirect('/login');
  }
}

export default async function PersonalAccountPage() {
  const profile = await getProfile();

  return (
    <div className="flex min-h-screen">
      <SettingsSidebar />
      <main className="flex-1 flex flex-col items-center py-9 px-8">
        <div className="w-full max-w-xl">
          <PersonalInfoForm profile={profile} />
        </div>
        <Footer />
      </main>
    </div>
  );
}
