/**
 * @fileoverview Componente per la visualizzazione di messaggi di errore.
 * 
 * Box stilizzato per mostrare messaggi di errore in modo consistente
 * in tutta l'applicazione (form, validazioni, errori API).
 * 
 * UTILIZZO:
 * - Form di login/registrazione
 * - Validazione campi
 * - Errori API
 * - Qualsiasi altro messaggio di errore UI
 * 
 * @module components/common/ErrorMessage
 */

// ============================================================================
// INTERFACCE
// ============================================================================

/**
 * Props per il componente ErrorMessage.
 * 
 * @interface ErrorMessageProps
 */
interface ErrorMessageProps {
  /** Messaggio di errore da visualizzare (se vuoto/null, non renderizza nulla) */
  error: string | null | undefined;
  /** Classi CSS aggiuntive per personalizzazione */
  className?: string;
}

// ============================================================================
// COMPONENTE
// ============================================================================

/**
 * Componente per visualizzare messaggi di errore.
 * 
 * Mostra un box rosso con il messaggio di errore.
 * Se il messaggio è vuoto o null, non renderizza nulla.
 * 
 * @param props - Props del componente
 * @returns Box di errore o null se nessun errore
 * 
 * @example
 * ```tsx
 * // Utilizzo base
 * <ErrorMessage error={error} />
 * 
 * // Con classi aggiuntive
 * <ErrorMessage error="Credenziali non valide" className="mt-4" />
 * ```
 */
export default function ErrorMessage({ error, className = '' }: ErrorMessageProps) {
  // Non renderizza nulla se non c'è errore
  if (!error) return null;
  
  return (
    <div 
      className={`
        mb-[10px] p-[10px] text-center text-sm 
        text-[#ED4956] bg-[#FFF3F4] dark:bg-[#3a1f1f] 
        border border-[#EDB8BD] dark:border-[#5d3e3e] 
        rounded-sm
        ${className}
      `}
      role="alert"
      aria-live="polite"
    >
      <p>{error}</p>
    </div>
  );
}
