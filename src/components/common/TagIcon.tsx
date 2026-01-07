interface TagIconProps {
  size?: number;
  className?: string;
}

export default function TagIcon({ size = 12, className = '' }: TagIconProps) {
  return (
    <svg
      aria-label="Tag"
      fill="currentColor"
      height={size}
      role="img"
      viewBox="0 0 24 24"
      width={size}
      className={className}
    >
      <title>Tag</title>
      <path d="M21.334 23H2.666a1 1 0 0 1-1-1v-1.354a6.279 6.279 0 0 1 6.272-6.272h8.124a6.279 6.279 0 0 1 6.271 6.271V22a1 1 0 0 1-1 1ZM12 13.269a6 6 0 1 1 6-6 6.007 6.007 0 0 1-6 6Z" />
    </svg>
  );
}
