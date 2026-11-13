import type { ReactNode } from 'react';

export interface HeadingProps {
  level?: 1 | 2 | 3;
  className?: string;
  children: ReactNode;
}

export function Heading({ level = 1, className, children }: HeadingProps) {
  const Tag = `h${level}` as const;
  const classes = ['cf-heading', className ?? ''].filter(Boolean).join(' ');

  return <Tag className={classes}>{children}</Tag>;
}

