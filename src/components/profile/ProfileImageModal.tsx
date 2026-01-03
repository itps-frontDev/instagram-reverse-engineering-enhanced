/**
 * @fileoverview Profile Image Change Modal
 *
 * Modal for changing or removing profile image.
 * Appears when clicking on profile picture.
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[rgb(38,38,38)] rounded-xl w-[400px] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="py-8 border-b border-[#DBDBDB] dark:border-[#2b3036]">
          <h3 className="text-center font-light text-[18px] leading-[25px] text-instagram-primary">
            Cambia immagine del profilo
          </h3>
        </div>

        {/* Actions */}
        <div className="flex flex-col">
          {/* Carica foto */}
          <button
            onClick={handleUploadClick}
            className="py-3 text-[14px] font-bold text-[#0095F6] border-b border-[#DBDBDB] dark:border-[#2b3036] hover:bg-gray-50 dark:hover:bg-[#1A1A1A] transition-colors"
          >
            Carica foto
          </button>

          {/* Rimuovi immagine attuale - solo se c'è un'immagine */}
          {hasImage && (
            <button
              onClick={handleRemoveClick}
              className="py-3 text-[14px] font-bold text-[#ED4956] border-b border-[#DBDBDB] dark:border-[#2b3036] hover:bg-gray-50 dark:hover:bg-[#1A1A1A] transition-colors"
            >
              Rimuovi immagine attuale
            </button>
          )}

          {/* Annulla */}
          <button
            onClick={onClose}
            className="py-3 text-[14px] text-instagram-primary hover:bg-gray-50 dark:hover:bg-[#1A1A1A] transition-colors"
          >
            Annulla
          </button>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}
