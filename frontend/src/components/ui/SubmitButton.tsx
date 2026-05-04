/**
 * @fileoverview Componente bottone submit per form.
 * 
 * Bottone di submit con spinner di caricamento integrato.
 * Stile Instagram consistente su tutti i form.
 * 
 * @module components/ui/SubmitButton
 */

'use client';

import { ButtonSpinner } from '@/components/common';

export interface SubmitButtonProps {
  /** Stato di invio in corso */
  isSubmitting: boolean;
  /** Disabilitato (oltre a isSubmitting) */
  disabled?: boolean;
  /** Testo del bottone */
  label?: string;
  /** Testo durante l'invio */
  loadingLabel?: string;
  /** Classe CSS aggiuntiva */
  className?: string;
  /** Larghezza del bottone */
  width?: string;
}

/**
 * Bottone submit con spinner integrato.
 * 
 * @example
 * ```tsx
 * <SubmitButton 
 *   isSubmitting={isSubmitting} 
 *   disabled={!isFormValid}
 *   label="Salva modifiche"
 * />
 * ```
 */
export function SubmitButton({
  isSubmitting,
  disabled = false,
  label = 'Invia',
  loadingLabel,
  className = '',
  width = 'w-[253px]',
}: SubmitButtonProps) {
  const isDisabled = disabled || isSubmitting;
  
  return (
    <button
      type="submit"
      disabled={isDisabled}
      className={`relative flex items-center justify-center ${width} h-11 mt-4 px-5 bg-[rgb(74,93,249)] hover:bg-[rgb(64,83,239)] text-white font-semibold text-sm rounded-xl cursor-pointer select-none disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[rgb(74,93,249)] transition-all ${className}`}
    >
      {isSubmitting ? (
        <>
          <ButtonSpinner size={20} color="white" />
          {loadingLabel && <span className="ml-2">{loadingLabel}</span>}
        </>
      ) : (
        label
      )}
    </button>
  );
}
