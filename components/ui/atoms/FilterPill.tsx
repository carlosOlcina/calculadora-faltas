import type { ButtonHTMLAttributes, ReactNode } from 'react';

export interface FilterPillProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  active: boolean;
  children: ReactNode;
}

export function FilterPill({
  active,
  className,
  children,
  ...props
}: FilterPillProps) {
  const classes = ['cf-filter-pill', className ?? ''].filter(Boolean).join(' ');

  return (
    <button
      type="button"
      aria-pressed={active}
      className={classes}
      {...props}
    >
      {children}
    </button>
  );
}
