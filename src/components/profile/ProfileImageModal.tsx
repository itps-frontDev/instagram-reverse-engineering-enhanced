/**
 * @fileoverview Modal cambio immagine profilo.
 *
 * Modal per cambiare o rimuovere l'immagine profilo.
 * Appare quando si clicca sulla foto profilo.
 * 
 * FUNZIONALITÀ:
 * - Upload nuova foto con file picker
 * - Rimozione foto esistente
 * - Input file nascosto con ref
 * - Stile Instagram con backdrop blur
 * 
 * @module components/profile/ProfileImageModal
 */

'use client';

import { useRef } from 'react';

interface ProfileImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => void;
  onRemove: () => void;
  hasImage: boolean;
}

export default function ProfileImageModal({
  isOpen,
  onClose,
  onUpload,
  onRemove,
  hasImage,
}: ProfileImageModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleUploadClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
      onClose();
    }
  }

  function handleRemoveClick() {
    onRemove();
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ 
        backgroundColor: 'rgba(12, 16, 20, 0.7)',
        backdropFilter: 'blur(0px)',
        WebkitBackdropFilter: 'blur(0px)',
      }}
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-[#212328] rounded-xl w-[400px] max-w-[90vw] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header con titolo */}
        <h3 className="text-xl font-normal text-center py-8 px-8 text-[#0c1014] dark:text-[#f8f9f9]">
          Cambia immagine del profilo
        </h3>

        {/* Pulsanti */}
        <div>
          {/* Carica foto */}
          <button 
            className="w-full h-12 border-t border-[#dbdfe4] dark:border-[#2b3036] text-[#4a5df9] font-bold text-sm hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors"
            onClick={handleUploadClick}
          >
            Carica foto
          </button>

          {/* Rimuovi immagine attuale */}
          {hasImage && (
            <button 
              className="w-full h-12 border-t border-[#dbdfe4] dark:border-[#2b3036] text-[#ed4956] font-bold text-sm hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors"
              onClick={handleRemoveClick}
            >
              Rimuovi immagine attuale
            </button>
          )}

          {/* Annulla */}
          <button 
            className="w-full h-12 border-t border-[#dbdfe4] dark:border-[#2b3036] text-[#0c1014] dark:text-[#f8f9f9] text-sm hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors rounded-b-xl"
            onClick={onClose}
          >
            Annulla
          </button>

          {/* Input file nascosto */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>
      </div>
    </div>
  );
}
