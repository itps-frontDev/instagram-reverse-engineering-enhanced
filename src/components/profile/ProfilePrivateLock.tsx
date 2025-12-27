/**
 * @fileoverview Profile private lock component
 *
 * Displays when viewing a private profile that the user doesn't follow.
 */

'use client';

import { Lock } from 'lucide-react';
import { ProfilePrivateLockProps } from '@/lib/types/profile';

export default function ProfilePrivateLock({
  username,
  isPending,
}: ProfilePrivateLockProps) {
  return (
    <div className="py-16 flex flex-col items-center justify-center text-center max-w-sm mx-auto">
      <div className="w-20 h-20 rounded-full border-2 border-black dark:border-white flex items-center justify-center mb-6">
        <Lock className="w-10 h-10" />
      </div>

      <h2 className="text-xl font-semibold mb-2">This Account is Private</h2>

      <p className="text-sm text-gray-500 dark:text-gray-400">
        {isPending
          ? `Follow request sent. Once ${username} approves your request, you'll be able to see their photos and videos.`
          : `Follow ${username} to see their photos and videos.`}
      </p>
    </div>
  );
}
