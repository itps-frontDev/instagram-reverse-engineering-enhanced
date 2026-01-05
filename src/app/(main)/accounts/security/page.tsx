/**
 * @fileoverview Security settings page
 */

import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { queryOne } from '@/lib/db';
import SettingsSidebar from '@/components/settings/SettingsSidebar';
import SecurityForm from '@/components/settings/SecurityForm';
import Footer from '@/components/common/Footer';

interface User {
  id: number;
  email: string | null;
  phone_number: string | null;
}

async function getUserData() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  try {
    const userData = await queryOne<User>(
      `SELECT id, email, phone_number
       FROM users
       WHERE id = ? AND deleted_at IS NULL`,
      [user.id]
    );

    if (!userData) {
      redirect('/login');
    }

    return userData;
  } catch (err) {
    console.error('[Security] Error fetching user data:', err);
    redirect('/login');
  }
}

export default async function SecurityPage() {
  const userData = await getUserData();

  return (
    <div className="flex min-h-screen">
      <SettingsSidebar />
      <main className="flex-1 flex flex-col items-center py-9 px-8">
        <div className="w-full max-w-xl">
          <SecurityForm user={userData} />
        </div>
        <Footer />
      </main>
    </div>
  );
}
