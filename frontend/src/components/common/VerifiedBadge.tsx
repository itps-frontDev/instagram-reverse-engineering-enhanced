/**
 * @fileoverview Badge di verifica di Instagram.
 * 
 * Badge blu con spunta bianca che indica un profilo verificato.
 * Utilizzato accanto allo username nei profili verificati.
 * 
 * @module components/common/VerifiedBadge
 */

// ============================================================================
// INTERFACCE
// ============================================================================

/**
 * Props per il componente VerifiedBadge.
 * 
 * @interface VerifiedBadgeProps
 */
interface VerifiedBadgeProps {
  /** Dimensione del badge in pixel (default: 12) */
  size?: number;
  /** Colore del badge (default: blu Instagram "rgb(0, 149, 246)") */
  color?: string;
}

// ============================================================================
// COMPONENTE
// ============================================================================

/**
 * Badge di verifica account.
 * 
 * Mostra il badge blu con spunta bianca usato da Instagram
 * per indicare account verificati (personaggi pubblici, brand, ecc.).
 * 
 * @param props - Props del componente
 * @returns Badge SVG verificato
 * 
 * @example
 * ```tsx
 * // Utilizzo base
 * <VerifiedBadge />
 * 
 * // Con dimensione personalizzata
 * <VerifiedBadge size={18} />
 * 
 * // Con colore personalizzato (es. bianco per sfondo scuro)
 * <VerifiedBadge color="white" />
 * ```
 */
export default function VerifiedBadge({ size = 12, color = "rgb(0, 149, 246)" }: VerifiedBadgeProps) {
  return (
    <svg
      aria-label="Verificato"
      role="img"
      viewBox="0 0 40 40"
      width={size}
      height={size}
      className="inline-block"
    >
      <title>Verificato</title>
      <path
        d="M19.998 3.094 14.638 0l-2.972 5.15H5.432v6.354L0 14.64 3.094 20 0 25.359l5.432 3.137v5.905h5.975L14.638 40l5.36-3.094L25.358 40l3.232-5.6h6.162v-6.01L40 25.359 36.905 20 40 14.641l-5.248-3.03v-6.46h-6.419L25.358 0l-5.36 3.094Zm7.415 11.225 2.254 2.287-11.43 11.5-6.835-6.93 2.244-2.258 4.587 4.581 9.18-9.18Z"
        fillRule="evenodd"
        fill={color}
      />
    </svg>
  );
}
