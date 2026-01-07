/**
 * @fileoverview Instagram-style loading bar component.
 * 
 * Displays a gradient loading bar at the top of the page during navigation and data loading.
 * Uses Instagram's signature gradient colors (yellow -> red -> purple).
 */

'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function InstagramLoadingBar() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    // Start loading when pathname changes
    setLoading(true);
    setProgress(0);

    // Simulate progress (total duration: 0.04s)
    const timer1 = setTimeout(() => setProgress(60), 10);
    // Complete loading
    const completeTimer = setTimeout(() => {
      setProgress(100);
      // Mantieni la barra visibile per 300ms dopo il 100%
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 300);
    }, 40);

    return () => {
      clearTimeout(timer1);
      clearTimeout(completeTimer);
    };
  }, [pathname]);

  if (!loading && progress === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 h-[3px] z-[9999] transition-opacity duration-200"
      style={{ opacity: loading ? 1 : 0 }}
    >
      <div
        className="h-full bg-gradient-to-r from-yellow-400 via-red-500 to-purple-600 transition-all duration-300 ease-out"
        style={{
          width: `${progress}%`,
          boxShadow: '0 0 10px rgba(255, 87, 34, 0.5)',
        }}
      />
    </div>
  );
}
