/**
 * @fileoverview Icona tab "Taggati" per il profilo.
 * 
 * Visualizza una silhouette utente per i post in cui
 * l'utente è stato taggato da altri.
 * Cambia colore in base allo stato attivo/inattivo.
 * 
 * @module components/profile/icons/TaggedTabIcon
 */

/** Props per TaggedTabIcon */
interface TaggedTabIconProps {
  /** Se il tab è attualmente selezionato */
  active: boolean;
}

/**
 * Icona SVG per il tab Taggati nel profilo.
 * 
 * STILI:
 * - Attivo: colore primario (#262626 light / #F5F5F5 dark)
 * - Inattivo: colore grigio (#8E8E8E)
 * 
 * @param props - Props del componente
 * @param props.active - Stato di selezione del tab
 */
export default function TaggedTabIcon({ active }: TaggedTabIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="currentColor"
      className={active ? 'text-[#262626] dark:text-[#F5F5F5]' : 'text-[#8E8E8E]'}
    >
      <title>Post in cui ti hanno taggato</title>
      <path d="M10.201 3.797 12 1.997l1.799 1.8a1.59 1.59 0 0 0 1.124.465h5.259A1.818 1.818 0 0 1 22 6.08v14.104a1.818 1.818 0 0 1-1.818 1.818H3.818A1.818 1.818 0 0 1 2 20.184V6.08a1.818 1.818 0 0 1 1.818-1.818h5.26a1.59 1.59 0 0 0 1.123-.465z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2px"></path>
      <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2px">
        <path d="M18.598 22.002V21.4a3.949 3.949 0 0 0-3.948-3.949H9.495A3.949 3.949 0 0 0 5.546 21.4v.603" fill="none"></path>
        <circle cx="12.07211" cy="11.07515" r="3.55556" fill="none"></circle>
      </g>
    </svg>
  );
}
