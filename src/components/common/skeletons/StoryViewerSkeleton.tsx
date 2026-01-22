/**
 * @fileoverview Skeleton loader per visualizzatore storie.
 *
 * Placeholder animato mostrato durante il caricamento delle storie.
 * Design coerente con il resto dell'app usando lo stile Instagram.
 * 
 * STRUTTURA SIMULATA:
 * - Background scuro con sfondo sfocato
 * - Container storia centrale con aspect ratio 9:16
 * - Progress bar in alto
 * - Header con avatar e username
 * - Spinner centrale Instagram-style
 * 
 * @module components/common/skeletons/StoryViewerSkeleton
 */

import { X } from 'lucide-react';
import { LoadingSpinner } from '@/components/common';

// ============================================================================
// INTERFACCE
// ============================================================================

/**
 * Props per StoryViewerSkeleton.
 */
interface StoryViewerSkeletonProps {
  /** Callback per chiudere il viewer */
  onClose?: () => void;
}

// ============================================================================
// COMPONENTE
// ============================================================================

/**
 * Skeleton per visualizzatore storie.
 * 
 * @param props - Props del componente
 * @param props.onClose - Callback per chiudere il viewer
 * @returns Placeholder animato per StoryViewer
 */
export default function StoryViewerSkeleton({ onClose }: StoryViewerSkeletonProps) {
  return (
    <div className="fixed inset-0 bg-[#1a1a1a] z-[60] flex items-center justify-center">
      {/* Container storia */}
      <div className="relative w-full max-w-[420px] h-full max-h-[750px] mx-4 animate-pulse">
        {/* Background placeholder */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg overflow-hidden">
          {/* Progress bars in alto */}
          <div className="absolute top-0 left-0 right-0 p-2 flex gap-1 z-10">
            <div className="flex-1 h-0.5 bg-gray-600 rounded-full" />
          </div>

          {/* Header con avatar e username */}
          <div className="absolute top-6 left-0 right-0 px-4 flex items-center gap-3 z-10">
            <div className="w-8 h-8 rounded-full bg-gray-600" />
            <div className="flex-1">
              <div className="h-3 w-24 bg-gray-600 rounded" />
            </div>
            <div className="h-3 w-10 bg-gray-600 rounded" />
          </div>

          {/* Spinner centrale */}
          <div className="absolute inset-0 flex items-center justify-center">
            <LoadingSpinner size={48} />
          </div>

          {/* Footer con input messaggio */}
          <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
            <div className="h-11 bg-gray-600/50 rounded-full border border-gray-500" />
          </div>
        </div>
      </div>

      {/* Pulsante chiudi (X) in alto a destra */}
      {onClose ? (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 bg-transparent hover:bg-white/10 rounded-full flex items-center justify-center transition-colors"
          aria-label="Chiudi"
        >
          <X className="w-6 h-6 text-white" />
        </button>
      ) : (
        <div className="absolute top-4 right-4 w-8 h-8 bg-gray-700 rounded-full" />
      )}
    </div>
  );
}
