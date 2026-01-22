/**
 * @fileoverview Icona stato vuoto per la sezione Taggati.
 * 
 * Mostrata quando l'utente non è stato taggato in nessun post.
 * Include una silhouette utente dentro una fotocamera.
 * 
 * @module components/profile/icons/TaggedEmptyIcon
 */

/** Props per TaggedEmptyIcon */
interface TaggedEmptyIconProps {
  /** Classi CSS aggiuntive */
  className?: string;
}

/**
 * Icona SVG per lo stato vuoto della sezione Taggati.
 * 
 * DESIGN:
 * - Cerchio esterno con bordo
 * - Fotocamera con silhouette utente al centro
 * - Dimensione: 62x62 px
 * 
 * @param props - Props del componente
 * @param props.className - Classi CSS opzionali
 */
export default function TaggedEmptyIcon({ className }: TaggedEmptyIconProps) {
  return (
    <svg
      aria-label="Foto in cui ci sei tu"
      fill="currentColor"
      height="62"
      role="img"
      viewBox="0 0 96 96"
      width="62"
      className={className}
    >
      <title>Foto in cui ci sei tu</title>
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
        d="M56.826 44.119a8.824 8.824 0 1 1-8.823-8.825 8.823 8.823 0 0 1 8.823 8.825Z"
        fill="none"
        stroke="currentColor"
        strokeMiterlimit="10"
        strokeWidth="2"
      ></path>
      <path
        d="M63.69 67.999a9.038 9.038 0 0 0-9.25-8.998H41.56A9.038 9.038 0 0 0 32.31 68"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      ></path>
      <path
        d="M48 20.215c-2.94 0-7.125 8.76-11.51 8.785h-4.705A8.785 8.785 0 0 0 23 37.784v22.428a8.785 8.785 0 0 0 8.785 8.785h32.43A8.785 8.785 0 0 0 73 60.212V37.784A8.785 8.785 0 0 0 64.215 29h-4.704c-4.385-.026-8.57-8.785-11.511-8.785Z"
        fill="none"
        stroke="currentColor"
        strokeMiterlimit="10"
        strokeWidth="2"
      ></path>
    </svg>
  );
}
