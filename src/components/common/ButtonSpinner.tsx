/**
 * @fileoverview Spinner di caricamento per pulsanti e azioni inline.
 * 
 * Spinner circolare più piccolo e semplice, ideale per:
 * - Pulsanti durante submit
 * - Indicatori di caricamento inline
 * - Azioni rapide
 * 
 * A differenza del LoadingSpinner principale (stile Instagram con 12 barre),
 * questo è uno spinner circolare minimalista per contesti più piccoli.
 * 
 * @module components/common/ButtonSpinner
 */

// ============================================================================
// INTERFACCE
// ============================================================================

/**
 * Props per il componente ButtonSpinner.
 * 
 * @interface ButtonSpinnerProps
 */
interface ButtonSpinnerProps {
  /** Dimensione dello spinner in pixel (default: 20) */
  size?: number;
  /** Colore dello spinner (default: "currentColor") */
  color?: string;
  /** Classi CSS aggiuntive */
  className?: string;
}

// ============================================================================
// COMPONENTE
// ============================================================================

/**
 * Spinner circolare per pulsanti e azioni inline.
 * 
 * Spinner SVG animato, più leggero e semplice del LoadingSpinner principale.
 * Ideale per indicare caricamento all'interno di pulsanti.
 * 
 * @param props - Props del componente
 * @returns Spinner SVG animato
 * 
 * @example
 * ```tsx
 * // In un pulsante
 * <button disabled={loading}>
 *   {loading ? <ButtonSpinner size={16} /> : 'Salva'}
 * </button>
 * 
 * // Con colore personalizzato
 * <ButtonSpinner color="white" size={20} />
 * ```
 */
export default function ButtonSpinner({ 
  size = 20, 
  color = 'currentColor',
  className = '' 
}: ButtonSpinnerProps) {
  return (
    <svg 
      className={`animate-spin ${className}`}
      style={{ width: size, height: size }}
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24"
      aria-label="Caricamento"
    >
      <circle 
        className="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke={color} 
        strokeWidth="4"
      />
      <path 
        className="opacity-75" 
        fill={color} 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
