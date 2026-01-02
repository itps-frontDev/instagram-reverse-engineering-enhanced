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

      <h2 className="text-xl font-semibold mb-2">Questo account è privato</h2>

      <p className="text-sm text-gray-500 dark:text-gray-400">
        {isPending
          ? `Segui questa persona per vedere le sue foto e i suoi video.`
          : `Segui questa persona per vedere le sue foto e i suoi video.`}
      </p>
    </div>
  );
}
