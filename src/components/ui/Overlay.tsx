/**
 * @fileoverview Componente Overlay in stile Instagram
 * 
 * Componente overlay/sfondo riutilizzabile per modal e pannelli.
 * Utilizza Tailwind CSS per lo styling.
 * 
 * @example
 * <Overlay isOpen={showPanel} onClose={handleClose}>
 *   <Panel>...</Panel>
 * </Overlay>
 */

'use client';

import { ReactNode, useEffect, useCallback } from 'react';

// ============================================================================
// TIPI
// ============================================================================

export interface OverlayProps {
  isOpen: boolean;
  onClose: () => void;
  children?: ReactNode;
  className?: string;
  /** Se il click sull'overlay lo chiude */
  closeOnClick?: boolean;
  /** Se premere ESC lo chiude */
  closeOnEscape?: boolean;
  /** Livello z-index */
  zIndex?: 'z-40' | 'z-50' | 'z-[100]';
}

// ============================================================================
// COMPONENTE
// ============================================================================

export function Overlay({
  isOpen,
  onClose,
  children,
  className = '',
  closeOnClick = true,
  closeOnEscape = true,
  zIndex = 'z-50',
}: OverlayProps) {
  // Gestione tasto ESC
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (closeOnEscape && e.key === 'Escape') {
        onClose();
      }
    },
    [closeOnEscape, onClose]
  );

  // Gestione click sull'overlay
  const handleClick = (e: React.MouseEvent) => {
    if (closeOnClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  // Aggiungi/rimuovi event listeners
  useEffect(() => {
    if (isOpen && closeOnEscape) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeOnEscape, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      className={`
        fixed inset-0 ${zIndex}
        bg-[rgba(12,16,20,0.7)]
        transition-opacity duration-200
        ${className}
      `}
      onClick={handleClick}
      aria-hidden="true"
    >
      {children}
    </div>
  );
}

export default Overlay;
