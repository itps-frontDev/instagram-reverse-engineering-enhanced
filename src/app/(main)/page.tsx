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
    <div className="w-full flex flex-col items-center xl:ml-[336px]">
      {/* Contenitore principale centrato */}
      <div className="w-full max-w-[470px] flex flex-col items-center">
        {/* Contenitore storie */}
        <div className="w-full mb-6">
          <Stories />
        </div>
        {/* Contenitore post */}
        <div className="w-full flex flex-col items-center">
          <FeedContainer />
        </div>
      </div>
      {/* Sidebar with suggestions (desktop XL only) */}
      <Suggestions />
    </div>
  );
}

