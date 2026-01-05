/**
 * @fileoverview Edit profile page
 *
 * Two-column layout with settings sidebar and edit profile form.
 */

import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { queryOne } from '@/lib/db';
import SettingsSidebar from '@/components/settings/SettingsSidebar';
import EditProfileForm from '@/components/settings/EditProfileForm';

interface Profile {
  id: number;
  username: string;
  full_name: string | null;
  bio: string | null;
  website_url: string | null;
  profile_image_url: string | null;
  gender: string | null;
  custom_gender: string | null;
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
      `SELECT id, username, full_name, bio, website_url, profile_image_url, gender, custom_gender
       FROM profiles
       WHERE user_id = ? AND deleted_at IS NULL`,
      [user.id]
    );

    if (!profile) {
      redirect('/login');
    }

    return profile;
  } catch (err) {
    console.error('[EditProfile] Error fetching profile:', err);
    redirect('/login');
  }
}

export default async function EditProfilePage() {
  const profile = await getProfile();

  return (
    <div className="flex min-h-screen bg-white dark:bg-black">
      {/* Sidebar */}
      <SettingsSidebar />

      {/* Main Content */}
      <main className="flex-1 p-8">
        <EditProfileForm profile={profile} />
      </main>
    </div>
  );
}
