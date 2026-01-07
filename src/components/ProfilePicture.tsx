import Image from 'next/image';

interface ProfilePictureProps {
  src?: string | null;
  alt?: string;
  size?: number;
  className?: string;
  hasStory?: boolean;
  storyViewed?: boolean; // true if story has been viewed
  username?: string;
  onStoryClick?: () => void;
}

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
  // Use default profile picture if src is missing or invalid
  const imageSrc = src && src.trim() !== '' ? src : '/images/default-pfp.jpg';

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
            className="w-full h-full rounded-full bg-white dark:bg-[#0c1014] flex items-center justify-center"
            style={{
              padding: `${innerPadding}px`,
            }}
          >
            <Image
              src={imageSrc}
              alt={alt}
              width={innerSize}
              height={innerSize}
              className={`rounded-full ${className}`}
              style={{
                boxSizing: 'border-box',
                display: 'block',
              }}
            />
          </div>
        </div>
      </button>
    );
  }

  return (
    <div className="relative inline-block">
      <Image
        src={imageSrc}
        alt={alt}
        width={size}
        height={size}
        className={`rounded-full ${className}`}
        style={{
          boxSizing: 'border-box',
          display: 'block',
        }}
      />
    </div>
  );
}
