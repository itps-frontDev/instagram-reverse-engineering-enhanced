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
    <div className="w-full flex items-start justify-center min-h-screen lg:-ml-[40px] xl:-ml-[190px]">
      {/* Contenitore principale centrato */}
      <div className="w-full max-w-[470px] mx-auto">
        {/* Contenitore storie */}
        <Stories />
        {/* Contenitore post */}
        <FeedContainer />
      </div>
      {/* Sidebar with suggestions (desktop XL only) */}
      <Suggestions />
    </div>
  );
}

