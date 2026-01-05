export default function BirthdayIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      aria-label="Compleanno"
      className={className}
      fill="currentColor"
      height="24"
      role="img"
      viewBox="0 0 24 24"
      width="24"
    >
      <rect
        x="3"
        y="9"
        width="18"
        height="12"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M7 9V6a1 1 0 0 1 2 0v3M12 9V6a1 1 0 0 1 2 0v3M17 9V6a1 1 0 0 1 2 0v3"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <line
        x1="3"
        y1="14"
        x2="21"
        y2="14"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}
