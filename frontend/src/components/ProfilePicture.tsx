/**
 * @fileoverview Componente immagine profilo.
 * 
 * Componente riutilizzabile per mostrare immagini profilo con supporto
 * per storie e fallback a immagine default.
 * 
 * FUNZIONALITÀ:
 * - Dimensione configurabile (size prop)
 * - Fallback automatico a immagine default
 * - Ring gradiente per storie non viste
 * - Ring grigio per storie viste
 * - Click handler per aprire storie
 * - Supporto dark mode
 * 
 * @module components/ProfilePicture
 */

import Image from 'next/image';

// ============================================================================
// INTERFACCE
// ============================================================================

/**
 * Props per il componente ProfilePicture.
 * 
 * @interface ProfilePictureProps
 */
interface ProfilePictureProps {
  /** URL immagine profilo */
  src?: string | null;
  /** Testo alternativo per accessibilità */
  alt?: string;
  /** Dimensione in pixel (default: 32) */
  size?: number;
  /** Classi CSS aggiuntive */
  className?: string;
  /** Se il profilo ha storie attive */
  hasStory?: boolean;
  /** Se la storia è stata già vista */
  storyViewed?: boolean;
  /** Username del profilo */
  username?: string;
  /** Handler click sulla storia */
  onStoryClick?: () => void;
}

// ============================================================================
// COSTANTI
// ============================================================================

/** Immagine profilo default */
const DEFAULT_PROFILE_IMAGE = '/images/default-pfp.jpg';

// ============================================================================
// COMPONENTE
// ============================================================================

/**
 * Immagine profilo con supporto storie.
 * 
 * Mostra l'immagine profilo con opzionale ring per indicare storie attive.
 * Il ring è colorato (gradiente Instagram) per storie non viste,
 * grigio per storie già viste.
 * 
 * @param props - Props del componente
 * @returns Immagine profilo renderizzata
 */
export default function ProfilePicture({ 
  src, 
  alt = 'Profile picture', 
  size = 32, 
  className = '', 
  hasStory = false,
  storyViewed = false,
  username,
  onStoryClick
}: ProfilePictureProps) {
  // Usa immagine default se src mancante o invalido
  const imageSrc = src && src.trim() !== '' ? src : DEFAULT_PROFILE_IMAGE;

  if (hasStory) {
    // Render with story ring like in Stories component
    const borderWidth = size >= 75 ? 3 : 2.5;
    const innerPadding = size >= 75 ? 2.5 : 2;
    const innerSize = size - (borderWidth + innerPadding) * 2;
    
    // Use gray ring if story has been viewed, gradient otherwise
    const ringClass = storyViewed 
      ? 'bg-gray-300 dark:bg-gray-600' 
      : 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500';

    return (
      <button
        onClick={onStoryClick}
        className="relative inline-block focus:outline-none"
        style={{ width: size, height: size }}
        disabled={!onStoryClick}
        type="button"
      >
        <div 
          className={`rounded-full ${ringClass} cursor-pointer`}
          style={{
            width: size,
            height: size,
            padding: `${borderWidth}px`,
          }}
        >
          <div 
            className="w-full h-full rounded-full bg-white dark:bg-[#0c1014] flex items-center justify-center overflow-hidden"
            style={{
              padding: `${innerPadding}px`,
            }}
          >
            <Image
              src={imageSrc}
              alt={alt}
              width={innerSize}
              height={innerSize}
              className={`rounded-full object-cover w-full h-full ${className}`}
              style={{
                boxSizing: 'border-box',
                display: 'block',
                objectFit: 'cover',
                width: '100%',
                height: '100%',
              }}
            />
          </div>
        </div>
      </button>
    );
  }

  return (
    <div 
      className="relative inline-block rounded-full overflow-hidden"
      style={{ width: size, height: size }}
    >
      <Image
        src={imageSrc}
        alt={alt}
        width={size}
        height={size}
        className={`object-cover ${className}`}
        style={{
          width: '100%',
          height: '100%',
        }}
      />
    </div>
  );
}
