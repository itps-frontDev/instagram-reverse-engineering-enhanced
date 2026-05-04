/**
 * @fileoverview Spinner di caricamento stile Instagram.
 * 
 * Spinner circolare con 12 barre radiali animate, identico
 * a quello utilizzato nell'app ufficiale di Instagram.
 * 
 * CARATTERISTICHE:
 * - 12 barre con opacità sfalsata per effetto rotazione
 * - Animazione fluida CSS
 * - Dimensione personalizzabile
 * 
 * @module components/common/LoadingSpinner
 */

// ============================================================================
// INTERFACCE
// ============================================================================

/**
 * Props per il componente LoadingSpinner.
 * 
 * @interface LoadingSpinnerProps
 */
interface LoadingSpinnerProps {
  /** Dimensione dello spinner in pixel (default: 50) */
  size?: number;
  /** Classi CSS aggiuntive */
  className?: string;
}

// ============================================================================
// COSTANTI
// ============================================================================

/** Numero di barre nello spinner */
const BAR_COUNT = 12;

/** Larghezza di ogni barra */
const BAR_WIDTH = 25;

/** Altezza di ogni barra */
const BAR_HEIGHT = 6;

/** Raggio bordi barra */
const BAR_RADIUS = 3;

/** Centro del viewBox SVG */
const CENTER = 50;

/** Colore delle barre */
const BAR_COLOR = '#555';

// ============================================================================
// COMPONENTE
// ============================================================================

/**
 * Spinner di caricamento stile Instagram.
 * 
 * Renderizza uno spinner con 12 barre radiali animate,
 * identico allo spinner dell'app Instagram ufficiale.
 * 
 * @param props - Props del componente
 * @returns Spinner SVG animato
 * 
 * @example
 * ```tsx
 * // Utilizzo base
 * <LoadingSpinner />
 * 
 * // Con dimensione personalizzata
 * <LoadingSpinner size={32} />
 * 
 * // Con classi aggiuntive
 * <LoadingSpinner className="my-4" />
 * ```
 */
export default function LoadingSpinner({ size = 50, className = '' }: LoadingSpinnerProps) {
  const bars = Array.from({ length: BAR_COUNT });
  
  return (
    <span
      className={`inline-block ${className}`}
      style={{ width: size, height: size }}
      aria-label="Caricamento"
      role="status"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        style={{ display: 'block' }}
      >
        {bars.map((_, i) => {
          const angle = (360 / BAR_COUNT) * i;
          // Le prime due barre sono più trasparenti per l'effetto "chiusura"
          let baseOpacity = 0.2 + 0.8 * (i / BAR_COUNT);
          if (i === 0) baseOpacity = 0.13;
          if (i === 1) baseOpacity = 0.18;
          
          return (
            <rect
              key={i}
              x={CENTER + 22}
              y={CENTER - BAR_HEIGHT / 2}
              width={BAR_WIDTH}
              height={BAR_HEIGHT}
              rx={BAR_RADIUS}
              ry={BAR_RADIUS}
              fill={BAR_COLOR}
              opacity={baseOpacity}
              transform={`rotate(${angle} ${CENTER} ${CENTER})`}
            >
              <animate
                attributeName="opacity"
                values="1;0.2;1"
                keyTimes="0;0.5;1"
                dur="1s"
                begin={`${(i / BAR_COUNT)}s`}
                repeatCount="indefinite"
              />
            </rect>
          );
        })}
      </svg>
    </span>
  );
}
