/**
 * @fileoverview Componente input password con toggle visibilità.
 * 
 * Input password con bottone mostra/nascondi integrato.
 * 
 * @module components/ui/PasswordInput
 */

'use client';

import { useState } from 'react';
import { getInputClassName } from './FormField';

export interface PasswordInputProps {
  /** ID HTML del campo */
  id: string;
  /** Valore corrente */
  value: string;
  /** Handler cambio valore */
  onChange: (value: string) => void;
  /** Placeholder */
  placeholder?: string;
  /** Campo con errore */
  hasError?: boolean;
  /** Classe CSS aggiuntiva */
  className?: string;
  /** Disabilitato */
  disabled?: boolean;
  /** Autocomplete attribute */
  autoComplete?: string;
}

/**
 * Input password con toggle visibilità.
 * 
 * @example
 * ```tsx
 * <PasswordInput
 *   id="password"
 *   value={password}
 *   onChange={setPassword}
 *   placeholder="Password"
 *   hasError={!!errors.password}
 * />
 * ```
 */
export function PasswordInput({
  id,
  value,
  onChange,
  placeholder = 'Password',
  hasError = false,
  className = '',
  disabled = false,
  autoComplete = 'current-password',
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  
  return (
    <div className="relative">
      <input
        id={id}
        type={showPassword ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={getInputClassName(hasError, `pr-20 ${className}`)}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={autoComplete}
      />
      {value.length > 0 && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#262626] dark:text-white"
          tabIndex={-1}
        >
          {showPassword ? 'Nascondi' : 'Mostra'}
        </button>
      )}
    </div>
  );
}
