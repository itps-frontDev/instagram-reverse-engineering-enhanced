/**
 * @fileoverview Componente Post del feed.
 * 
 * Card singola del post con header, immagine, azioni e commenti.
 */

'use client';

import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from 'lucide-react';

export default function Post() {
  return (
    <article className="bg-white dark:bg-[#0c1014] border border-gray-200 dark:border-gray-800 rounded-lg mb-4">
      {/* Post Header */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm dark:text-white">username</span>
            <span className="text-gray-500 dark:text-gray-400 text-sm">• 2h</span>
          </div>
        </div>
        <button>
          <MoreHorizontal className="w-6 h-6 dark:text-white" />
        </button>
      </div>

      {/* Post Image */}
      <div className="w-full aspect-square bg-gray-100 dark:bg-gray-800" />

      {/* Post Actions */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <button>
              <Heart className="w-6 h-6 hover:text-gray-500 dark:text-white dark:hover:text-gray-400 transition" />
            </button>
            <button>
              <MessageCircle className="w-6 h-6 hover:text-gray-500 dark:text-white dark:hover:text-gray-400 transition" />
            </button>
            <button>
              <Send className="w-6 h-6 hover:text-gray-500 dark:text-white dark:hover:text-gray-400 transition" />
            </button>
          </div>
          <button>
            <Bookmark className="w-6 h-6 hover:text-gray-500 dark:text-white dark:hover:text-gray-400 transition" />
          </button>
        </div>

        {/* Likes Count */}
        <p className="font-semibold text-sm mb-2 dark:text-white">1.234 Mi piace</p>

        {/* Caption */}
        <div className="text-sm mb-2 dark:text-white">
          <span className="font-semibold mr-2">username</span>
          <span>Questa è la caption del post... #instagram #photo</span>
        </div>

        {/* View Comments */}
        <button className="text-sm text-gray-500 dark:text-gray-400 mb-2">
          Visualizza tutti i 42 commenti
        </button>

        {/* Add Comment */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-800">
          <input
            type="text"
            placeholder="Aggiungi un commento..."
            className="flex-1 text-sm outline-none bg-transparent dark:text-white dark:placeholder-gray-500"
          />
          <button className="text-blue-500 font-semibold text-sm">
            Pubblica
          </button>
        </div>
      </div>
    </article>
  );
}
