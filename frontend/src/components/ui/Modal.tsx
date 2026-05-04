/**
 * @fileoverview Componente Modal in stile Instagram
 * 
 * Componente dialog modale riutilizzabile che segue il design system di Instagram.
 * Utilizza Tailwind CSS per lo styling con supporto completo per la dark mode.
 * 
 * @example
 * <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
 *   <Modal.Title>Conferma azione</Modal.Title>
 *   <Modal.Button variant="danger" onClick={handleDelete}>
 *     Elimina
 *   </Modal.Button>
 *   <Modal.Button variant="cancel" onClick={() => setShowModal(false)}>
 *     Annulla
 *   </Modal.Button>
 * </Modal>
 */

'use client';

import { ReactNode, useEffect, useCallback, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';

// ============================================================================
// TIPI
// ============================================================================

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

export interface ModalTitleProps {
  children: ReactNode;
  className?: string;
}

export interface ModalButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'danger' | 'cancel';
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export interface ModalContentProps {
  children: ReactNode;
  className?: string;
}

// ============================================================================
// CONTESTO
// ============================================================================

const ModalContext = createContext<{ onClose: () => void } | null>(null);

// ============================================================================
// SOTTOCOMPONENTI
// ============================================================================

/**
 * Componente titolo del modal
 */
function ModalTitle({ children, className = '' }: ModalTitleProps) {
  return (
    <h2
      className={`
        text-xl font-normal text-center
        text-[rgb(12,16,20)] dark:text-[rgb(248,249,249)]
        px-8 pt-8 pb-4 break-words
        ${className}
      `}
    >
      {children}
    </h2>
  );
}

/**
 * Componente pulsante del modal
 */
function ModalButton({ 
  children, 
  variant = 'cancel', 
  onClick, 
  disabled = false,
  className = '' 
}: ModalButtonProps) {
  const context = useContext(ModalContext);
  
  const variantStyles = {
    primary: 'text-[rgb(74,93,249)] font-bold',
    danger: 'text-[rgb(237,73,86)] font-bold',
    cancel: 'text-[rgb(12,16,20)] dark:text-[rgb(248,249,249)] font-normal',
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (variant === 'cancel' && context) {
      context.onClose();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`
        w-full h-12 min-h-12 px-2 py-1
        text-sm text-center select-none cursor-pointer
        border-t border-[rgb(219,223,228)] dark:border-[rgb(43,48,54)]
        bg-transparent hover:bg-black/5 dark:hover:bg-white/5
        transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
        last:rounded-b-xl
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {children}
    </button>
  );
}

/**
 * Wrapper per contenuto personalizzato del modal
 */
function ModalContent({ children, className = '' }: ModalContentProps) {
  return (
    <div className={`px-4 py-3 ${className}`}>
      {children}
    </div>
  );
}

// ============================================================================
// COMPONENTE PRINCIPALE
// ============================================================================

/**
 * Componente Modal con overlay
 */
function Modal({ isOpen, onClose, children, className = '' }: ModalProps) {
  // Gestione tasto ESC
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  // Gestione click esterno
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Aggiungi/rimuovi event listeners
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const modalContent = (
    <ModalContext.Provider value={{ onClose }}>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
        onClick={handleOverlayClick}
        role="dialog"
        aria-modal="true"
      >
        <div
          className={`
            bg-white dark:bg-[rgb(33,35,40)]
            rounded-3xl
            text-[rgb(12,16,20)] dark:text-[rgb(248,249,249)]
            text-sm leading-[18px]
            w-[400px] max-w-[90vw] max-h-[90vh]
            overflow-auto
            animate-in fade-in zoom-in-95 duration-200
            ${className}
          `}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </ModalContext.Provider>
  );

  // Usa portal per renderizzare alla radice del document
  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
}

// ============================================================================
// ESPORTAZIONI
// ============================================================================

// Collega i sottocomponenti
Modal.Title = ModalTitle;
Modal.Button = ModalButton;
Modal.Content = ModalContent;

export { Modal, ModalTitle, ModalButton, ModalContent };
export default Modal;
