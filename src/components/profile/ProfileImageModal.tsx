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
      role="dialog"
      className="fixed inset-0 z-50 flex items-start justify-center pointer-events-none"
      style={{ height: '520px' }}
      onClick={onClose}
    >
      <div
        className="bg-[rgb(33,35,40)] rounded-[24px] overflow-auto pointer-events-auto"
        style={{ height: '223px', maxHeight: '1231px', width: '560px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', maxWidth: '100%' }}>
          {/* Header with title */}
          <div style={{ padding: '32px 0 8px' }}>
            <h3
              className="text-center text-[rgb(248,249,249)] break-words"
              style={{
                fontSize: '20px',
                lineHeight: '25px',
                fontWeight: 400,
                maxWidth: '100%',
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
              }}
            >
              Cambia immagine del profilo
            </h3>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Carica foto */}
            <button
              className="text-center"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0)',
                borderTop: '1px solid rgb(43, 48, 54)',
                borderBottom: 'none',
                borderLeft: 'none',
                borderRight: 'none',
                color: 'rgb(74, 93, 249)',
                fontWeight: 700,
                fontSize: '14px',
                height: '48px',
                minHeight: '48px',
                padding: '4px 8px',
                cursor: 'pointer',
                userSelect: 'none',
              }}
              onClick={handleUploadClick}
            >
              Carica foto
            </button>

            {/* Rimuovi immagine attuale */}
            {hasImage && (
              <button
                className="text-center"
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0)',
                  borderTop: '1px solid rgb(43, 48, 54)',
                  borderBottom: 'none',
                  borderLeft: 'none',
                  borderRight: 'none',
                  color: 'rgb(237, 73, 86)',
                  fontWeight: 700,
                  fontSize: '14px',
                  height: '48px',
                  minHeight: '48px',
                  padding: '4px 8px',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
                onClick={handleRemoveClick}
              >
                Rimuovi immagine attuale
              </button>
            )}

            {/* Annulla */}
            <button
              className="text-center"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0)',
                borderTop: '1px solid rgb(43, 48, 54)',
                borderBottom: 'none',
                borderLeft: 'none',
                borderRight: 'none',
                borderBottomLeftRadius: '12px',
                borderBottomRightRadius: '12px',
                color: 'rgb(248, 249, 249)',
                fontWeight: 400,
                fontSize: '14px',
                height: '48px',
                minHeight: '48px',
                padding: '4px 8px',
                cursor: 'pointer',
                userSelect: 'none',
              }}
              onClick={onClose}
            >
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
    </div>
  );
}
