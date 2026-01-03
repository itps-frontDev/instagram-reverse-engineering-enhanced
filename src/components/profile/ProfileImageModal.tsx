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
    <div role="dialog" className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header with title */}
        <h3 className="modal-title">Cambia immagine del profilo</h3>

        {/* Buttons */}
        <div>
          {/* Carica foto */}
          <button className="modal-btn-primary" onClick={handleUploadClick}>
            Carica foto
          </button>

          {/* Rimuovi immagine attuale */}
          {hasImage && (
            <button className="modal-btn-danger" onClick={handleRemoveClick}>
              Rimuovi immagine attuale
            </button>
          )}

          {/* Annulla */}
          <button className="modal-btn-cancel" onClick={onClose}>
            Annulla
          </button>

          {/* Hidden file input */}
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
