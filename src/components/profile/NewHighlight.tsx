/**
 * @fileoverview New Highlight button component
 *
 * Displays the "Nuova" (New) button for creating story highlights.
 * Only visible on own profile.
 */

'use client';

import { Plus } from 'lucide-react';

export default function NewHighlight() {
  return (
    <div className="flex flex-col items-center gap-1">
      {/* Circle Button */}
      <button
        className="w-[77px] h-[77px] rounded-full border-[1.5px] border-gray-300 dark:border-gray-600 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
        aria-label="Nuova storia in evidenza"
      >
        <Plus className="w-10 h-10 text-gray-400 dark:text-gray-500" strokeWidth={1.5} />
      </button>

      {/* Label */}
      <span className="text-xs font-normal text-black dark:text-white">
        Nuova
      </span>
    </div>
  );
}
