/**
 * @fileoverview Icona "Account" per le impostazioni.
 * 
 * Icona silhouette utente usata nel menu impostazioni
 * per la sezione informazioni account personali.
 * 
 * @module components/settings/icons/AccountIcon
 */

/** Props per AccountIcon */
interface AccountIconProps {
  /** Classi CSS per dimensioni (default: "w-6 h-6") */
  className?: string;
}

/**
 * Icona SVG per la sezione Account nelle impostazioni.
 * 
 * @param props - Props del componente
 * @param props.className - Classi CSS opzionali
 */
export default function AccountIcon({ className = "w-6 h-6" }: AccountIconProps) {
  return (
    <svg
      aria-label=""
      className={className}
      fill="currentColor"
      height="24"
      role="img"
      viewBox="0 0 24 24"
      width="24"
    >
      <title></title>
      <path
        d="M2.667 22v-1.355a5.271 5.271 0 0 1 5.271-5.271h8.124a5.271 5.271 0 0 1 5.271 5.271V22"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeMiterlimit="10"
        strokeWidth="2"
      />
      <circle
        cx="12"
        cy="7.268"
        fill="none"
        r="5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeMiterlimit="10"
        strokeWidth="2"
      />
    </svg>
  );
}
