/**
 * @fileoverview Homepage/Feed principale di Instagram
 *
 * Mostra il feed dei post degli utenti seguiti, le storie e i suggerimenti.
 */

import Stories from '@/components/feed/Stories';
import FeedContainer from '@/components/feed/FeedContainer';
import Suggestions from '@/components/feed/Suggestions';
import MobileSearchBar from '@/components/feed/MobileSearchBar';

export default function HomePage() {
  return (
    <div className="w-full min-h-screen">
      {/* Mobile Search Bar - visible only on mobile */}
      <MobileSearchBar />
      
      <div className="w-full flex items-start justify-center lg:-ml-[40px] xl:-ml-[190px]">
        {/* Contenitore principale centrato */}
        <div className="w-full max-w-[470px] mx-auto max-[639px]:px-0">
          {/* Contenitore storie */}
          <Stories />
          {/* Contenitore post */}
          <FeedContainer />
        </div>
      </div>
      {/* Sidebar with suggestions (desktop XL only) */}
      <Suggestions />
    </div>
  );
}

