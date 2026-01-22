/**
 * @fileoverview Icona tab "Reels" per il profilo.
 * 
 * Visualizza un'icona video con pulsante play centrale.
 * Cambia colore in base allo stato attivo/inattivo.
 * 
 * @module components/profile/icons/ReelsTabIcon
 */

/** Props per ReelsTabIcon */
interface ReelsTabIconProps {
  /** Se il tab è attualmente selezionato */
  active: boolean;
}

/**
 * Icona SVG per il tab Reels nel profilo.
 * 
 * STILI:
 * - Attivo: colore primario (#262626 light / #F5F5F5 dark)
 * - Inattivo: colore grigio (#8E8E8E)
 * 
 * @param props - Props del componente
 * @param props.active - Stato di selezione del tab
 */
export default function ReelsTabIcon({ active }: ReelsTabIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="currentColor"
      className={active ? 'text-[#262626] dark:text-[#F5F5F5]' : 'text-[#8E8E8E]'}
    >
      <title>Reels</title>
      <g stroke="currentColor" strokeLinejoin="round" strokeWidth="2px">
        <path d="M2.0493 7.002 21.9503 7.002" fill="none"></path>
        <path strokeLinecap="round" d="M13.50427 2.001 16.36227 7.002" fill="none"></path>
        <path strokeLinecap="round" d="M7.20677 2.1099 10.00177 7.0019" fill="none"></path>
        <path d="M2 12.001v3.449c0 2.849.698 4.006 1.606 4.945.94.908 2.098 1.607 4.946 1.607h6.896c2.848 0 4.006-.699 4.946-1.607.908-.939 1.606-2.096 1.606-4.945V8.552c0-2.848-.698-4.006-1.606-4.945C19.454 2.699 18.296 2 15.448 2H8.552c-2.848 0-4.006.699-4.946 1.607C2.698 4.546 2 5.704 2 8.552z" strokeLinecap="round" fill="none"></path>
      </g>
      <path d="M9.763 17.664a.908.908 0 0 1-.454-.787V11.63a.909.909 0 0 1 1.364-.788l4.545 2.624a.909.909 0 0 1 0 1.575l-4.545 2.624a.91.91 0 0 1-.91 0z" fillRule="evenodd"></path>
    </svg>
  );
}
