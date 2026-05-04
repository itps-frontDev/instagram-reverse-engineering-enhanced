/**
 * @fileoverview Componente Button in stile Instagram
 * 
 * Componente pulsante riutilizzabile con varianti multiple che segue il design system di Instagram.
 * Utilizza Tailwind CSS per lo styling con supporto completo per la dark mode.
 * 
 * @example
 * // Pulsante primario (Segui)
 * <Button variant="primary">Segui</Button>
 * 
 * // Pulsante secondario (Modifica profilo)
 * <Button variant="secondary">Modifica profilo</Button>
 * 
 * // Pulsante stato seguendo
 * <Button variant="following">Segui già</Button>
 */

'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';

// ============================================================================
// TIPI
// ============================================================================

export type ButtonVariant = 
  | 'primary'    // Blu - Pulsante Segui
  | 'secondary'  // Grigio - Modifica profilo, Visualizza archivio
  | 'pending'    // Grigio - Richiesta effettuata
  | 'following'  // Grigio - Segui già
  | 'removed'    // Attenuato - Rimosso
  | 'danger'     // Rosso - Elimina, Rimuovi
  | 'ghost';     // Trasparente - Pulsanti icona

export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
}

// ============================================================================
// STILI
// ============================================================================

const baseStyles = 'inline-flex items-center justify-center font-semibold transition-colors focus:outline-none disabled:pointer-events-none';

const variantStyles: Record<ButtonVariant, string> = {
  primary: 
    'bg-[rgb(74,93,249)] hover:bg-[rgb(64,83,239)] text-white disabled:opacity-50',
  
  secondary: 
    'bg-[rgb(240,242,245)] hover:bg-[rgb(219,223,228)] text-[rgb(12,16,20)] ' +
    'dark:bg-[rgb(37,41,46)] dark:hover:bg-[rgb(27,31,36)] dark:text-[rgb(248,249,249)]',
  
  pending: 
    'bg-[rgb(240,242,245)] hover:bg-[rgb(219,223,228)] text-[rgb(12,16,20)] ' +
    'dark:bg-[rgb(37,41,46)] dark:hover:bg-[rgb(27,31,36)] dark:text-[rgb(248,249,249)]',
  
  following: 
    'bg-[rgb(239,239,239)] hover:bg-[rgb(219,219,219)] text-[rgb(12,16,20)] gap-1 ' +
    'dark:bg-[rgb(54,54,54)] dark:hover:bg-[rgb(38,38,38)] dark:text-[rgb(248,249,249)]',
  
  removed: 
    'bg-[rgb(230,232,235)] text-[rgb(162,170,180)] opacity-85 pointer-events-none ' +
    'dark:bg-[rgb(54,57,63)] dark:opacity-80 shadow-sm',
  
  danger: 
    'bg-transparent hover:bg-red-50 text-[rgb(237,73,86)] font-bold ' +
    'dark:hover:bg-red-950/20',
  
  ghost: 
    'bg-transparent hover:bg-black/5 dark:hover:bg-white/10',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-7 px-3 text-xs rounded-md',
  md: 'h-8 px-4 text-sm rounded-lg',
  lg: 'h-10 px-6 text-base rounded-lg',
};

// ============================================================================
// COMPONENTE
// ============================================================================

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      className = '',
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const classes = [
      baseStyles,
      variantStyles[variant],
      sizeStyles[size],
      fullWidth ? 'w-full' : '',
      className,
    ].filter(Boolean).join(' ');

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {children}
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
