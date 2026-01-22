/**
 * @fileoverview Icona "Privacy" per le impostazioni.
 * 
 * Icona lucchetto usata nel menu impostazioni
 * per la sezione privacy account (pubblico/privato).
 * 
 * @module components/settings/icons/PrivacyIcon
 */

/** Props per PrivacyIcon */
interface PrivacyIconProps {
  /** Classi CSS per dimensioni (default: "w-6 h-6") */
  className?: string;
}

/**
 * Icona SVG per la sezione Privacy nelle impostazioni.
 * 
 * @param props - Props del componente
 * @param props.className - Classi CSS opzionali
 */
export default function PrivacyIcon({ className = "w-6 h-6" }: PrivacyIconProps) {
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
      <path
        d="M6.71 9.555h10.581a2.044 2.044 0 0 1 2.044 2.044v8.357a2.044 2.044 0 0 1-2.043 2.043H6.71a2.044 2.044 0 0 1-2.044-2.044V11.6A2.044 2.044 0 0 1 6.71 9.555Zm1.07 0V6.222a4.222 4.222 0 0 1 8.444 0v3.333"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}
