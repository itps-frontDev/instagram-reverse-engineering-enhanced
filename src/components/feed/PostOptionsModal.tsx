/**
 * @fileoverview Modal opzioni post.
 * 
 * Modal con azioni disponibili per un post: Modifica, Elimina, Annulla.
 * 
 * FUNZIONALITÀ:
 * - Pulsante Elimina (sempre visibile)
 * - Pulsante Modifica (solo per proprietario)
 * - Pulsante Annulla
 * - Stile consistente modali Instagram
 * 
 * @module components/feed/PostOptionsModal
 */

'use client';

interface PostOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onDelete: () => void;
  canEdit?: boolean;
}

export default function PostOptionsModal({
  isOpen,
  onClose,
  onEdit,
  onDelete,
  canEdit = false,
}: PostOptionsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/75 dark:bg-[rgba(12,16,20,0.75)]"
        onClick={onClose}
      />
      
      <div 
        className="relative bg-white dark:bg-[#262626] rounded-xl w-full max-w-[400px] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Elimina (Delete) first */}
        <button
          className="w-full h-14 border-b border-gray-300 dark:border-[#363636] text-[#ed4956] font-bold text-base hover:bg-gray-50 dark:hover:bg-[#23272b] transition-colors"
          style={{ fontSize: '1rem' }}
          onClick={() => {
            onDelete();
            onClose();
          }}
        >
          Elimina
        </button>
        {/* Modifica (Edit) second, only if canEdit and onEdit */}
        {canEdit && onEdit && (
          <button
            className="w-full h-14 border-b border-gray-300 dark:border-[#363636] text-[#262626] dark:text-[#f8f9f9] text-base hover:bg-gray-50 dark:hover:bg-[#23272b] transition-colors"
            style={{ fontSize: '1rem' }}
            onClick={() => {
              onEdit();
              onClose();
            }}
          >
            Modifica
          </button>
        )}
        {/* Annulla (Cancel) last */}
        <button
          className="w-full h-14 text-[#262626] dark:text-[#f8f9f9] text-base hover:bg-gray-50 dark:hover:bg-[#23272b] transition-colors rounded-b-xl"
          style={{ fontSize: '1rem' }}
          onClick={onClose}
        >
          Annulla
        </button>
      </div>
    </div>
  );
}
