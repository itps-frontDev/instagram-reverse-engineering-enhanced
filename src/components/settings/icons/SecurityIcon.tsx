export default function SecurityIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      aria-label="Sicurezza"
      className={className}
      fill="currentColor"
      height="24"
      role="img"
      viewBox="0 0 24 24"
      width="24"
    >
      <path
        d="M12 2L4 5v6.09c0 5.03 3.47 9.73 8 10.91 4.53-1.18 8-5.88 8-10.91V5l-8-3z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M9 12l2 2 4-4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}
