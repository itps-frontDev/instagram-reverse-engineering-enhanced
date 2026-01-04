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
    <div className="w-full flex justify-center px-4 mt-8 mb-12">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center flex-shrink-0">
          <Lock className="w-5 h-5 text-white" />
        </div>
        <div className="flex flex-col text-white">
          <h2 className="text-sm font-semibold whitespace-nowrap">Questo account è privato</h2>
          <p className="text-sm whitespace-nowrap" style={{ color: 'rgb(168, 168, 168)' }}>
            Segui questa persona per vedere le sue foto e i suoi video.
          </p>
        </div>
      </div>
    </div>
  );
}
