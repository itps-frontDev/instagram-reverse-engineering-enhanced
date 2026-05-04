/**
 * @fileoverview Icona "Altre opzioni" di Instagram.
 * 
 * Icona con tre puntini orizzontali usata per aprire menu
 * di opzioni aggiuntive su post, profili, commenti, ecc.
 * 
 * @module components/common/MoreOptionsIcon
 */

// ============================================================================
// INTERFACCE
// ============================================================================

/**
 * Props per il componente MoreOptionsIcon.
 * 
 * @interface MoreOptionsIconProps
 */
interface MoreOptionsIconProps {
  /** Dimensione dell'icona in pixel (default: 24) */
  size?: number;
}

// ============================================================================
// COMPONENTE
// ============================================================================

/**
 * Icona "Altre opzioni" (tre puntini).
 * 
 * @param props - Props del componente
 * @returns Icona SVG tre puntini
 * 
 * @example
 * ```tsx
 * <MoreOptionsIcon size={20} />
 * ```
 */
export default function MoreOptionsIcon({ size = 24 }: MoreOptionsIconProps) {
  return (
    <svg
      aria-label="Altre opzioni"
      fill="currentColor"
      height={size}
      role="img"
      viewBox="0 0 24 24"
      width={size}
    >
      <title>Altre opzioni</title>
      <circle cx="12" cy="12" r="1.5"></circle>
      <circle cx="6" cy="12" r="1.5"></circle>
      <circle cx="18" cy="12" r="1.5"></circle>
    </svg>
  );
}
