/**
 * @fileoverview Modale per la creazione di un nuovo post.
 * 
 * Permette di caricare foto e video per creare un nuovo post.
 */

'use client';

import { useState, useRef, DragEvent } from 'react';
import { X } from 'lucide-react';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreatePostModal({ isOpen, onClose }: CreatePostModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  };

  const handleFiles = (files: File[]) => {
    // TODO: Implementare la gestione dei file
    console.log('Files:', files);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-[#262626] rounded-2xl w-full max-w-2xl mx-4 overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-[#363636]">
          <div className="w-6" /> {/* Spacer */}
          <h2 className="text-base font-semibold text-[#262626] dark:text-white">
            Crea nuovo post
          </h2>
          <button
            onClick={onClose}
            className="text-[#262626] dark:text-white hover:opacity-70 transition-opacity"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div
          className={`flex flex-col items-center justify-center p-16 transition-colors ${
            isDragging ? 'bg-gray-50 dark:bg-[#1a1a1a]' : ''
          }`}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Icone sovrapposte */}
          <div className="relative mb-8 flex items-center justify-center h-28">
            {/* Icona immagine (sotto/sinistra) */}
            <div 
              className="absolute"
              style={{ 
                transform: 'rotate(-5deg) translateX(-25px)',
                zIndex: 1
              }}
            >
              <svg
                className="w-20 h-20 text-[#262626] dark:text-white drop-shadow-lg"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.65"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {/* Sole */}
                <circle cx="6" cy="8" r="1.5" fill="none" stroke="currentColor" />
                {/* Montagne */}
                <path d="M2.5 19 L8 12 L12 16 L16 10 L22 17" fill="none" />
                {/* Cornice */}
                <rect x="2" y="4" width="18" height="16" rx="2" fill="none" />
              </svg>
            </div>

            {/* Icona reels (sopra/destra) */}
            <div 
              className="absolute"
              style={{ 
                transform: 'rotate(5deg) translateX(15px) translateY(10px)',
                zIndex: 2
              }}
            >
              <svg
                className="w-20 h-20 drop-shadow-xl"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Rettangolo riempito con bordo bianco */}
                <rect x="3" y="3" width="18" height="18" rx="4" ry="4" fill="#262626" stroke="white" strokeWidth="0.65" strokeLinecap="round" strokeLinejoin="round"/>
                {/* Play button bianco */}
                <path d="M9 8 Q9.5 8 10 8.5 L16 11.5 Q16.5 12 16.5 12 Q16.5 12 16 12.5 L10 15.5 Q9.5 16 9 16 Q9 16 9 15.5 L9 8.5 Q9 8 9 8" fill="none" stroke="white" strokeWidth="0.75"/>
              </svg>
            </div>
          </div>

          {/* Testo */}
          <p className="text-xl mb-6 text-[#262626] dark:text-white">
            Trascina le foto e i video qui
          </p>

          {/* Bottone */}
          <button
            onClick={handleButtonClick}
            className="px-4 py-2 bg-[#4150f7] text-white rounded-lg font-semibold hover:bg-[#3442d9] transition-colors"
          >
            Seleziona dal computer
          </button>

          {/* Input file nascosto */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>
      </div>
    </div>
  );
}
