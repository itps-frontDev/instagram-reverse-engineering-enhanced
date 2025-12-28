/**
 * @fileoverview Profile bio component
 *
 * Displays full name, bio text, and website link with Instagram styling.
 * Parses @mentions and #hashtags for clickability.
 *
 * @module components/profile/ProfileBio
 */

'use client';

import Link from 'next/link';
import { BadgeCheck } from 'lucide-react';
import { ProfileBioProps } from '@/lib/types/profile';

/**
 * Parse bio text for @mentions and #hashtags.
 * Converts them to clickable links.
 */
function parseBioText(text: string) {
  const parts = text.split(/(@\w+|#\w+)/g);

  return parts.map((part, index) => {
    if (part.startsWith('@')) {
      const username = part.substring(1);
      return (
        <Link
          key={index}
          href={`/profile/${username}`}
          className="text-[#00376b] dark:text-[#e0f1ff] hover:opacity-70"
        >
          {part}
        </Link>
      );
    }
    if (part.startsWith('#')) {
      const hashtag = part.substring(1);
      return (
        <Link
          key={index}
          href={`/explore/tags/${hashtag}`}
          className="text-[#00376b] dark:text-[#e0f1ff] hover:opacity-70"
        >
          {part}
        </Link>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

/**
 * ProfileBio Component
 *
 * Displays user's full name, bio, and website in Instagram format.
 */
export default function ProfileBio({
  fullName,
  bio,
  websiteUrl,
  isVerified,
}: ProfileBioProps) {
  return (
    <div className="text-sm">
      {/* Full Name with Verified Badge */}
      {fullName && (
        <div className="flex items-center gap-1 font-semibold mb-1">
          <span>{fullName}</span>
          {isVerified && (
            <BadgeCheck className="w-4 h-4 text-[#0095f6] fill-[#0095f6]" />
          )}
        </div>
      )}

      {/* Bio Text */}
      {bio && (
        <div className="whitespace-pre-wrap leading-[1.4] mb-1">
          {parseBioText(bio)}
        </div>
      )}

      {/* Website Link */}
      {websiteUrl && (
        <a
          href={websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#00376b] dark:text-[#e0f1ff] hover:opacity-70 font-semibold"
        >
          {websiteUrl.replace(/^https?:\/\/(www\.)?/, '')}
        </a>
      )}
    </div>
  );
}
