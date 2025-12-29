/**
 * @fileoverview Stories highlights carousel component
 *
 * Displays saved story highlights in a horizontal scrollable list.
 */

'use client';

import Image from 'next/image';
import { StoriesHighlightsProps } from '@/lib/types/profile';

export default function StoriesHighlights({
  highlights,
  profileId,
}: StoriesHighlightsProps) {
  if (highlights.length === 0) {
    return null;
  }

  return (
    <div className="px-4 py-6">
      <div className="max-w-5xl mx-auto overflow-x-auto scrollbar-hide">
        <div className="flex gap-6">
          {highlights.map((highlight) => (
            <button
              key={highlight.id}
              className="flex flex-col items-center flex-shrink-0"
            >
              <div className="w-[77px] h-[77px] rounded-full border border-gray-200 dark:border-gray-700 p-0.5 mb-2">
                <div className="relative w-full h-full rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                  {highlight.cover_image_url && (
                    <Image
                      src={highlight.cover_image_url}
                      alt={highlight.name}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
              </div>
              <span className="text-xs text-center max-w-[77px] truncate">
                {highlight.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
