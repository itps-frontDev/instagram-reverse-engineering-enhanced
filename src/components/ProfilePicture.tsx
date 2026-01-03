import Image from 'next/image';

interface ProfilePictureProps {
  src?: string | null;
  alt?: string;
  size?: number;
  className?: string;
}

export default function ProfilePicture({ src, alt = 'Profile picture', size = 32, className = '' }: ProfilePictureProps) {
  const isDefault = !src || src.trim() === '';
  const validSrc = isDefault ? '/images/default-pfp.jpg' : src;
  
  return (
    <span style={{ position: 'relative', display: 'inline-block', width: size, height: size }}>
      <Image
        src={validSrc}
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
      {isDefault && (
        <span
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(85, 85, 85, 0.7)',
            borderRadius: '50%',
            pointerEvents: 'none',
          }}
        />
      )}
    </span>
  );
}
