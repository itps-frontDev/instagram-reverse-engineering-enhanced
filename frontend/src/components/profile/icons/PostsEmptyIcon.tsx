/**
 * @fileoverview Icona stato vuoto per la sezione Post.
 * 
 * Mostrata quando l'utente non ha ancora pubblicato post.
 * Include un'icona fotocamera stilizzata dentro un cerchio.
 * 
 * @module components/profile/icons/PostsEmptyIcon
 */

/** Props per PostsEmptyIcon */
interface PostsEmptyIconProps {
  /** Classi CSS aggiuntive */
  className?: string;
}

/**
 * Icona SVG per lo stato vuoto della sezione Post.
 * 
 * DESIGN:
 * - Cerchio esterno con bordo
 * - Icona fotocamera al centro
 * - Dimensione: 62x62 px
 * 
 * @param props - Props del componente
 * @param props.className - Classi CSS opzionali
 */
export default function PostsEmptyIcon({ className }: PostsEmptyIconProps) {
  return (
    <svg
      aria-label="Quando condividi le foto, saranno visualizzate sul tuo profilo."
      fill="currentColor"
      height="62"
      role="img"
      viewBox="0 0 96 96"
      width="62"
      className={className}
    >
      <title>Quando condividi le foto, saranno visualizzate sul tuo profilo.</title>
      <circle
        cx="48"
        cy="48"
        fill="none"
        r="47"
        stroke="currentColor"
        strokeMiterlimit="10"
        strokeWidth="2"
      ></circle>
      <ellipse
        cx="48.002"
        cy="49.524"
        fill="none"
        rx="10.444"
        ry="10.476"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="2.095"
      ></ellipse>
      <path
        d="M63.994 69A8.02 8.02 0 0 0 72 60.968V39.456a8.023 8.023 0 0 0-8.01-8.035h-1.749a4.953 4.953 0 0 1-4.591-3.242C56.61 25.696 54.859 25 52.469 25h-8.983c-2.39 0-4.141.695-5.181 3.178a4.954 4.954 0 0 1-4.592 3.242H32.01a8.024 8.024 0 0 0-8.012 8.035v21.512A8.02 8.02 0 0 0 32.007 69Z"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="2"
      ></path>
    </svg>
  );
}
