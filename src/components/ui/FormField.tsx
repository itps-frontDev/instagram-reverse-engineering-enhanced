/**
 * @fileoverview Componente campo form generico.
 * 
 * Wrapper per campi form con label, input e helper/error text.
 * Garantisce stile consistente su tutti i form.
 * 
 * @module components/ui/FormField
 */

import React from 'react';

export interface FormFieldProps {
  /** Label del campo */
  label: string;
  /** ID HTML del campo */
  htmlFor?: string;
  /** Messaggio di errore (se presente, mostra errore invece di helper) */
  error?: string;
  /** Testo di aiuto sotto il campo */
  helperText?: string;
  /** Campo input/select/textarea */
  children: React.ReactNode;
  /** Classe CSS aggiuntiva per il container */
  className?: string;
  /** Stile della label (default: grande per settings) */
  labelSize?: 'sm' | 'lg';
  /** Mostra label obbligatoria */
  required?: boolean;
}

/**
 * Componente wrapper per campi form.
 * 
 * @example
 * ```tsx
 * <FormField 
 *   label="Email" 
 *   htmlFor="email"
 *   error={errors.email}
 *   helperText="Inserisci la tua email"
 * >
 *   <input id="email" type="email" ... />
 * </FormField>
 * ```
 */
export function FormField({
  label,
  htmlFor,
  error,
  helperText,
  children,
  className = '',
  labelSize = 'lg',
  required = false,
}: FormFieldProps) {
  const labelClasses = labelSize === 'lg' 
    ? 'block text-lg font-bold mb-3' 
    : 'block text-sm font-medium mb-2';
    
  return (
    <div className={`mb-6 ${className}`}>
      <label htmlFor={htmlFor} className={labelClasses}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {children}
      
      {error ? (
        <p className="text-xs text-red-500 mt-2 leading-4">
          {error}
        </p>
      ) : helperText ? (
        <p className="text-xs text-[rgb(115,115,115)] dark:text-[rgb(168,168,168)] mt-2 leading-4">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Stili predefiniti per input che possono avere errori.
 * Usa questa funzione per generare le classi degli input.
 * 
 * @example
 * ```tsx
 * <input className={getInputClassName(!!errors.email)} />
 * ```
 */
export function getInputClassName(hasError: boolean, additionalClasses: string = ''): string {
  const baseClasses = 'w-full px-3 py-2.5 border rounded-lg bg-transparent focus:outline-none focus:ring-1 text-sm';
  const errorClasses = hasError
    ? 'border-red-500 focus:ring-red-500'
    : 'border-gray-300 dark:border-gray-600 focus:ring-gray-400 dark:focus:ring-gray-500';
  
  return `${baseClasses} ${errorClasses} ${additionalClasses}`.trim();
}
