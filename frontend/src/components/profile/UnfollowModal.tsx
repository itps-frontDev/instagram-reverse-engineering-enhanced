/**
 * @fileoverview Modal conferma smetti di seguire.
 * 
 * Modal di conferma per smettere di seguire un utente.
 * 
 * FUNZIONALITÀ:
 * - Avatar e username dell'utente
 * - Messaggio di conferma
 * - Pulsanti Smetti di seguire / Annulla
 * - Stato loading durante operazione
 * - Portal per render fuori dall'albero
 * - Blocco scroll body quando aperto
 * 
 * @module components/profile/UnfollowModal
 */

'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ProfilePicture } from '@/components';

interface UnfollowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isUnfollowing?: boolean;
  username?: string;
  profileImage?: string;
}

export default function UnfollowModal({
  isOpen,
  onClose,
  onConfirm,
  isUnfollowing = false,
  username = '',
  profileImage,
}: UnfollowModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/75 dark:bg-[rgba(12,16,20,0.75)]"
        onClick={onClose}
      />
      
      <div 
        className="relative bg-white dark:bg-[#262626] rounded-xl w-full max-w-[400px] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header con immagine profilo */}
        <div className="flex flex-col items-center p-8 pb-4">
          <div className="mb-5">
            <ProfilePicture
              src={profileImage}
              alt={username}
              size={90}
            />
          </div>
          <h2 className="text-sm text-[#262626] dark:text-[#FAFAFA] text-center">
            Se cambi idea, dovrai chiedere di nuovo di seguire @{username}.
          </h2>
        </div>
        
        {/* Pulsante Conferma Unfollow */}
        <div className="border-t border-gray-300 dark:border-[#363636]">
          <button
            onClick={onConfirm}
            disabled={isUnfollowing}
            className="w-full py-4 text-sm font-bold text-[#ED4956] transition-colors hover:bg-gray-50 dark:hover:bg-[#363636] disabled:opacity-50 cursor-pointer"
          >
            {isUnfollowing ? 'Annullamento...' : 'Non seguire più'}
          </button>
        </div>
        
        {/* Pulsante Annulla */}
        <div className="border-t border-gray-300 dark:border-[#363636]">
          <button
            onClick={onClose}
            disabled={isUnfollowing}
            className="w-full py-4 text-sm text-[#262626] dark:text-[#FAFAFA] transition-colors hover:bg-gray-50 dark:hover:bg-[#363636] disabled:opacity-50 cursor-pointer"
          >
            Annulla
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
