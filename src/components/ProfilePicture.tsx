import Image from 'next/image';

interface ProfilePictureProps {
  src?: string | null;
  alt?: string;
  size?: number;
  className?: string;
}

export default function ProfilePicture({ src, alt = 'Profile picture', size = 32, className = '' }: ProfilePictureProps) {
  const hasValidSrc = src && src.trim() !== '';

  // Se non c'è immagine, mostra l'icona utente base
  if (!hasValidSrc) {
    return (
      <div
        className={`rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center ${className}`}
        style={{
          width: size,
          height: size,
          minWidth: size,
          minHeight: size,
        }}
      >
        <svg
          width={size * 0.6}
          height={size * 0.6}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="12" cy="8" r="4" fill="currentColor" className="text-gray-400 dark:text-gray-500" />
          <path
            d="M4 20C4 16.6863 6.68629 14 10 14H14C17.3137 14 20 16.6863 20 20V21H4V20Z"
            fill="currentColor"
            className="text-gray-400 dark:text-gray-500"
          />
        </svg>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`rounded-full ${className}`}
      style={{
        boxSizing: 'border-box',
        width: size,
        height: size,
        display: 'block',
      }}
    />
  );
}
