/**
 * @fileoverview Homepage/Feed principale di Instagram
 *
 * Mostra il feed dei post degli utenti seguiti, le storie e i suggerimenti.
 */

import Stories from '@/components/feed/Stories';
import FeedContainer from '@/components/feed/FeedContainer';
import Suggestions from '@/components/feed/Suggestions';

export default function HomePage() {
  return (
    <>
      <div className="px-4 pt-16">
        {/* Stories Section */}
        <Stories />

        {/* Feed Posts */}
        <FeedContainer />
      </div>

      {/* Sidebar with suggestions (desktop XL only) */}
      <Suggestions />
    </>
  );
}
