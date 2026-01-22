/**
 * @fileoverview Pulsante nuova storia in evidenza.
 *
 * Mostra il pulsante "Nuova" per creare storie in evidenza.
 * Visibile solo sul proprio profilo.
 * 
 * FUNZIONALITÀ:
 * - Cerchio con icona plus
 * - Stile Instagram con doppio bordo
 * - Label "Nuova" sotto l'icona
 * - Accessibilità con aria-label
 * 
 * @module components/profile/NewHighlight
 */

'use client';

import { Plus } from 'lucide-react';

export default function NewHighlight() {
  return (
    <div className="flex flex-col items-center gap-1 p-[15px]">
      {/* Circle Button con doppio cerchio: bordo e interno */}
      <button
        className="w-[87px] h-[87px] rounded-full flex items-center justify-center border-0 bg-transparent relative group"
        aria-label="Nuova storia in evidenza"
        tabIndex={0}
      >
        {/* Outer border effetto canvas con border-bottom custom */}
        <span className="absolute inset-0 rounded-full border-4 border-[rgb(240,242,245)] dark:border-[rgb(37,41,46)] z-[1]" />
        {/* Inner cerchio grigio */}
        <span className="relative w-[72px] h-[72px] rounded-full flex items-center justify-center bg-[rgb(240,242,245)] dark:bg-[rgb(37,41,46)] z-[2]">
          <Plus className="w-10 h-10 text-gray-400 dark:text-gray-500" strokeWidth={1.5} />
        </span>
      </button>
      {/* Label */}
      <span className="text-xs text-instagram-primary">
        Nuova
      </span>
    </div>
  );
}
