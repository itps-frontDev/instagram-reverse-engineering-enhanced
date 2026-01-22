/**
 * @fileoverview Icona "Modifica profilo" per le impostazioni.
 * 
 * Icona cerchio con silhouette utente usata nel menu impostazioni
 * per la sezione modifica profilo pubblico.
 * 
 * @module components/settings/icons/EditProfileIcon
 */

/** Props per EditProfileIcon */
interface EditProfileIconProps {
  /** Classi CSS per dimensioni (default: "w-6 h-6") */
  className?: string;
}

/**
 * Icona SVG per la sezione Modifica profilo nelle impostazioni.
 * 
 * @param props - Props del componente
 * @param props.className - Classi CSS opzionali
 */
export default function EditProfileIcon({ className = "w-6 h-6" }: EditProfileIconProps) {
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
      <circle
        cx="12.004"
        cy="12.004"
        fill="none"
        r="10.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeMiterlimit="10"
        strokeWidth="2"
      />
      <path
        d="M18.793 20.014a6.08 6.08 0 0 0-1.778-2.447 3.991 3.991 0 0 0-2.386-.791H9.38a3.994 3.994 0 0 0-2.386.791 6.09 6.09 0 0 0-1.779 2.447"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeMiterlimit="10"
        strokeWidth="2"
      />
      <circle
        cx="12.006"
        cy="9.718"
        fill="none"
        r="4.109"
        stroke="currentColor"
        strokeLinecap="round"
        strokeMiterlimit="10"
        strokeWidth="2"
      />
    </svg>
  );
}
