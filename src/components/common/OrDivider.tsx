/**
 * @fileoverview Componente divisore con testo "O" (Or Divider).
 * 
 * Linea orizzontale con testo centrale usata per separare opzioni
 * alternative nei form (es. "Accedi con Facebook O inserisci email").
 * 
 * UTILIZZO:
 * - Separazione tra metodi di login
 * - Separazione tra opzioni alternative
 * - Form di registrazione
 * 
 * @module components/common/OrDivider
 */

// ============================================================================
// INTERFACCE
// ============================================================================

/**
 * Props per il componente OrDivider.
 * 
 * @interface OrDividerProps
 */
interface OrDividerProps {
  /** Testo da mostrare nel divisore (default: "O") */
  text?: string;
  /** Classi CSS aggiuntive per personalizzazione */
  className?: string;
}

// ============================================================================
// COMPONENTE
// ============================================================================

/**
 * Componente divisore con testo centrale.
 * 
 * Renderizza una linea orizzontale con testo al centro,
 * comunemente usato per separare opzioni alternative nei form.
 * 
 * @param props - Props del componente
 * @returns Divisore con testo
 * 
 * @example
 * ```tsx
 * // Utilizzo base (testo "O")
 * <OrDivider />
 * 
 * // Con testo personalizzato
 * <OrDivider text="oppure" />
 * 
 * // Con margini personalizzati
 * <OrDivider className="my-6" />
 * ```
 */
export default function OrDivider({ text = 'O', className = '' }: OrDividerProps) {
  return (
    <div className={`flex items-center my-[18px] ${className}`}>
      {/* Linea sinistra */}
      <div className="flex-1 h-px bg-[#DBDBDB] dark:bg-[#262626]" />
      
      {/* Testo centrale */}
      <div className="px-[18px] text-[13px] font-semibold text-[#8E8E8E]">
        {text}
      </div>
      
      {/* Linea destra */}
      <div className="flex-1 h-px bg-[#DBDBDB] dark:bg-[#262626]" />
    </div>
  );
}
