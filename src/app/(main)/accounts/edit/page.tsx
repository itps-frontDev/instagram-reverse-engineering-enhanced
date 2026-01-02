/**
 * @fileoverview Edit profile page
 *
 * Two-column layout with settings sidebar and edit profile form.
 */

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { jwtVerify } from 'jose';
import { queryOne } from '@/lib/db';
import SettingsSidebar from '@/components/settings/SettingsSidebar';
import EditProfileForm from '@/components/settings/EditProfileForm';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

interface User {
  id: number;
  username: string;
  full_name: string | null;
  bio: string | null;
  website_url: string | null;
  profile_image_url: string | null;
}

async function getProfile() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    redirect('/login');
  }

  try {
    // Verify JWT and get user ID
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId as number;

    // Fetch user profile from database
    const user = await queryOne<User>(
      `SELECT id, username, full_name, bio, website_url, profile_image_url
       FROM users
       WHERE id = ?`,
      [userId]
    );

    if (!user) {
      redirect('/login');
    }

    return user;
  } catch (err) {
    console.error('Error verifying token or fetching profile:', err);
    redirect('/login');
  }
}

export default async function EditProfilePage() {
  const profile = await getProfile();

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 py-4 px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-normal">Impostazioni</h1>
        </div>
      </header>

      {/* Two-column Layout */}
      <div className="flex max-w-7xl mx-auto">
        {/* Sidebar */}
        <SettingsSidebar />

        {/* Main Content */}
        <main className="flex-1 p-8">
          <h2 className="text-xl font-semibold mb-6">Modifica profilo</h2>
          <EditProfileForm profile={profile} />
        </main>
      </div>
    </div>
  );
}
