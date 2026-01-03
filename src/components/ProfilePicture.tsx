import Image from 'next/image';

interface ProfilePictureProps {
  src?: string | null;
  alt?: string;
  size?: number;
  className?: string;
}

export default function ProfilePicture({ src, alt = 'Profile picture', size = 32, className = '' }: ProfilePictureProps) {
  const validSrc = src && src.trim() !== '' ? src : '/images/default-pfp.jpg';
  return (
    <Image
      src={validSrc}
      alt={alt}
      width={size}
      height={size}
      className={`sidebar-pfp border-2 border-[rgb(12,16,20)] dark:border-[rgb(245,245,245)] rounded-full ${className}`}
      style={{
        boxSizing: 'border-box',
        width: size,
        height: size,
        display: 'block',
      }}
    />
  );
}
