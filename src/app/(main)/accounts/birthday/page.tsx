/**
 * @fileoverview Birthday settings page
 */

import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { queryOne } from '@/lib/db';
import SettingsSidebar from '@/components/settings/SettingsSidebar';
import BirthdayForm from '@/components/settings/BirthdayForm';
import Footer from '@/components/common/Footer';

interface User {
  id: number;
  date_of_birth: string;
}

async function getUserData() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  try {
    const userData = await queryOne<User>(
      `SELECT id, date_of_birth
       FROM users
       WHERE id = ? AND deleted_at IS NULL`,
      [user.id]
    );

    if (!userData) {
      redirect('/login');
    }

    return userData;
  } catch (err) {
    console.error('[Birthday] Error fetching user data:', err);
    redirect('/login');
  }
}

export default async function BirthdayPage() {
  const userData = await getUserData();

  return (
    <div className="flex min-h-screen">
      <SettingsSidebar />
      <main className="flex-1 flex flex-col items-center py-9 px-8">
        <div className="w-full max-w-xl">
          <BirthdayForm user={userData} />
        </div>
        <Footer />
      </main>
    </div>
  );
}
