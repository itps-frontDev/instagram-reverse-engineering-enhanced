/**
 * @fileoverview Icona "Altre opzioni" (tre puntini) di Instagram
 */

interface MoreOptionsIconProps {
  size?: number;
}

export default function MoreOptionsIcon({ size = 24 }: MoreOptionsIconProps) {
  return (
    <svg
      aria-label="Altre opzioni"
      fill="currentColor"
      height={size}
      role="img"
      viewBox="0 0 24 24"
      width={size}
    >
      <title>Altre opzioni</title>
      <circle cx="12" cy="12" r="1.5"></circle>
      <circle cx="6" cy="12" r="1.5"></circle>
      <circle cx="18" cy="12" r="1.5"></circle>
    </svg>
  );
}
