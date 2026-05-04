/**
 * @fileoverview Modal di conferma eliminazione post.
 * 
 * Mostra un dialog di conferma prima di eliminare definitivamente un post.
 * 
 * FUNZIONALITÀ:
 * - Conferma eliminazione con messaggio chiaro
 * - Stato di loading durante eliminazione
 * - Possibilità di annullare l'operazione
 * - Stile consistente con modali Instagram
 * 
 * @module components/feed/DeletePostModal
 */

'use client';

interface DeletePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export default function DeletePostModal({
  isOpen,
  onClose,
  onConfirm,
  isDeleting = false,
}: DeletePostModalProps) {
  if (!isOpen) return null;

  return (
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
        {/* Header */}
        <div className="flex flex-col items-center p-8 pb-4">
          <h2 className="text-lg font-semibold text-[#262626] dark:text-[#FAFAFA] mb-2">
            Eliminare post?
          </h2>
          <p className="text-sm text-[#737373] dark:text-[#A8A8A8] text-center">
            Sei sicuro di voler eliminare questo post?
          </p>
        </div>
        
        <div className="border-t border-gray-300 dark:border-[#363636]">
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="w-full py-4 text-sm font-bold text-[#ED4956] transition-colors hover:bg-gray-50 dark:hover:bg-[#363636] disabled:opacity-50 cursor-pointer"
          >
            {isDeleting ? 'Eliminazione...' : 'Elimina'}
          </button>
        </div>
        
        <div className="border-t border-gray-300 dark:border-[#363636]">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="w-full py-4 text-sm text-[#262626] dark:text-[#FAFAFA] transition-colors hover:bg-gray-50 dark:hover:bg-[#363636] disabled:opacity-50 cursor-pointer"
          >
            Annulla
          </button>
        </div>
      </div>
    </div>
  );
}
