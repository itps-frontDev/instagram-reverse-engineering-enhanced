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
      className={`rounded-full object-cover ${className}`}
    />
  );
}
