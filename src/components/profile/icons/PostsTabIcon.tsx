interface PostsTabIconProps {
  active: boolean;
}

export default function PostsTabIcon({ active }: PostsTabIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="currentColor"
      className={active ? 'text-[#262626] dark:text-[#F5F5F5]' : 'text-[#8E8E8E]'}
    >
      <title>Post</title>
      <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2px" d="M3 3H21V21H3z"></path>
      <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2px" d="M9.01486 3 9.01486 21"></path>
      <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2px" d="M14.98514 3 14.98514 21"></path>
      <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2px" d="M21 9.01486 3 9.01486"></path>
      <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2px" d="M21 14.98514 3 14.98514"></path>
    </svg>
  );
}
