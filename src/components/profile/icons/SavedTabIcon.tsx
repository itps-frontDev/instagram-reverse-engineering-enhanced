interface SavedTabIconProps {
  active: boolean;
}

export default function SavedTabIcon({ active }: SavedTabIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="currentColor"
      className={active ? 'text-[#262626] dark:text-[#F5F5F5]' : 'text-[#8E8E8E]'}
    >
      <title>Elementi salvati</title>
      <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2px" d="M20 21 12 13.44 4 21 4 3 20 3 20 21z"></path>
    </svg>
  );
}
