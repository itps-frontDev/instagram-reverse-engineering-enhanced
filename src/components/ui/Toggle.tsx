/**
 * @fileoverview Componente Toggle Switch in stile Instagram
 * 
 * Componente interruttore toggle riutilizzabile che segue il design system di Instagram.
 * Utilizza Tailwind CSS per lo styling con supporto completo per la dark mode.
 * 
 * @example
 * <Toggle
 *   checked={isPrivate}
 *   onChange={setIsPrivate}
 *   label="Account privato"
 * />
 */

'use client';

import { forwardRef, InputHTMLAttributes } from 'react';

// ============================================================================
// TIPI
// ============================================================================

export interface ToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'type'> {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
}

// ============================================================================
// COMPONENTE
// ============================================================================

export const Toggle = forwardRef<HTMLInputElement, ToggleProps>(
  ({ checked, onChange, label, description, disabled, className = '', ...props }, ref) => {
    return (
      <label
        className={`
          flex items-center justify-between gap-3 cursor-pointer
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${className}
        `}
      >
        {(label || description) && (
          <div className="flex-1">
            {label && (
              <span className="text-sm font-medium text-[rgb(12,16,20)] dark:text-[rgb(248,249,249)]">
                {label}
              </span>
            )}
            {description && (
              <p className="text-xs text-[rgb(142,142,142)] mt-0.5">
                {description}
              </p>
            )}
          </div>
        )}
        
        <div className="relative">
          <input
            ref={ref}
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            disabled={disabled}
            className="sr-only peer"
            {...props}
          />
          <div
            className={`
              w-11 h-6 rounded-full
              transition-colors duration-200 ease-in-out
              shadow-inner
              ${checked 
                ? 'bg-[rgb(74,93,249)]' 
                : 'bg-[rgb(219,223,228)] dark:bg-[rgb(54,54,54)]'
              }
            `}
          />
          <div
            className={`
              absolute top-0.5 left-0.5
              w-5 h-5 rounded-full
              bg-white
              shadow-md
              transition-transform duration-200 ease-in-out
              ${checked ? 'translate-x-5' : 'translate-x-0'}
            `}
          />
        </div>
      </label>
    );
  }
);

Toggle.displayName = 'Toggle';

export default Toggle;
