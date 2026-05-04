/**
 * @fileoverview Icona indicatore carosello di Instagram.
 * 
 * Icona SVG che indica la presenza di più immagini/video in un post.
 * Mostrata nell'angolo dei post nella griglia del profilo quando
 * il post contiene più di un media.
 * 
 * @module components/common/CarouselIcon
 */

// ============================================================================
// INTERFACCE
// ============================================================================

/**
 * Props per il componente CarouselIcon.
 * 
 * @interface CarouselIconProps
 */
interface CarouselIconProps {
  /** Classi CSS per dimensioni e stile (default: "w-5 h-5") */
  className?: string;
}

// ============================================================================
// COMPONENTE
// ============================================================================

/**
 * Icona indicatore carosello/media multipli.
 * 
 * Renderizza l'icona ufficiale di Instagram per indicare post con
 * più immagini o video (carosello).
 * 
 * @param props - Props del componente
 * @returns Icona SVG carosello
 * 
 * @example
 * ```tsx
 * // Utilizzo base
 * <CarouselIcon />
 * 
 * // Con dimensioni personalizzate
 * <CarouselIcon className="w-6 h-6" />
 * ```
 */
export default function CarouselIcon({ className = "w-5 h-5" }: CarouselIconProps) {
  return (
    <svg
      aria-label="Carosello"
      className={className}
      fill="currentColor"
      height="20"
      role="img"
      viewBox="0 0 48 48"
      width="20"
    >
      <title>Carosello</title>
      <path d="M34.8 29.7V11c0-2.9-2.3-5.2-5.2-5.2H11c-2.9 0-5.2 2.3-5.2 5.2v18.7c0 2.9 2.3 5.2 5.2 5.2h18.7c2.8-.1 5.1-2.4 5.1-5.2zM39.2 15v16.1c0 4.5-3.7 8.2-8.2 8.2H14.9c-.6 0-.9.7-.5 1.1 1 1.1 2.4 1.8 4.1 1.8h13.4c5.7 0 10.3-4.6 10.3-10.3V18.5c0-1.6-.7-3.1-1.8-4.1-.5-.4-1.2 0-1.2.6z"></path>
    </svg>
  );
}
