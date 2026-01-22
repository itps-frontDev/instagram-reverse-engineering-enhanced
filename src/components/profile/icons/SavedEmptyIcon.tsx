/**
 * @fileoverview Icona stato vuoto per la sezione Salvati.
 * 
 * Mostrata quando l'utente non ha ancora salvato contenuti.
 * Include un segnalibro stilizzato dentro un cerchio.
 * 
 * @module components/profile/icons/SavedEmptyIcon
 */

/** Props per SavedEmptyIcon */
interface SavedEmptyIconProps {
  /** Classi CSS aggiuntive */
  className?: string;
}

/**
 * Icona SVG per lo stato vuoto della sezione Salvati.
 * 
 * DESIGN:
 * - Cerchio esterno con bordo
 * - Segnalibro al centro
 * - Dimensione: 62x62 px
 * 
 * @param props - Props del componente
 * @param props.className - Classi CSS opzionali
 */
export default function SavedEmptyIcon({ className }: SavedEmptyIconProps) {
  return (
    <svg
      aria-label="Salva"
      fill="currentColor"
      height="62"
      role="img"
      viewBox="0 0 96 96"
      width="62"
      className={className}
    >
      <title>Salva</title>
      <circle
        cx="48"
        cy="48"
        fill="none"
        r="47"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      ></circle>
      <path
        d="M66 68.685 49.006 51.657a1.42 1.42 0 0 0-2.012 0L30 68.685V27h36Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      ></path>
    </svg>
  );
}
