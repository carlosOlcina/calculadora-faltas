export interface BrandMarkProps {
  className?: string;
}

export function BrandMark({ className = 'cf-brand-mark' }: BrandMarkProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <path d="M8 9h8" />
      <path d="M8 13h4" />
      <path d="M14.5 15l1.5 1.5L18.5 14" />
    </svg>
  );
}

