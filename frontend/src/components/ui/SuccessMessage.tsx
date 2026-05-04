/**
 * @fileoverview Componente messaggio di successo.
 * 
 * Mostra un messaggio di successo con stile consistente.
 * 
 * @module components/ui/SuccessMessage
 */

export interface SuccessMessageProps {
  /** Il messaggio da visualizzare */
  message: string;
  /** Stile del bordo del box */
  variant?: 'rounded-md' | 'rounded-xl';
  /** Classe CSS aggiuntiva */
  className?: string;
}

/**
 * Componente per mostrare messaggi di successo.
 * 
 * @example
 * ```tsx
 * {successMessage && <SuccessMessage message={successMessage} />}
 * ```
 */
export function SuccessMessage({ 
  message, 
  variant = 'rounded-md',
  className = '' 
}: SuccessMessageProps) {
  if (!message) return null;
  
  return (
    <div 
      className={`mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 ${variant} ${className}`}
      role="alert"
    >
      <p className="text-sm text-green-800 dark:text-green-200">{message}</p>
    </div>
  );
}
