import type { ReactNode } from 'react';

export interface BadgeProps {
  mono?: boolean;
  children: ReactNode;
}

export function Badge({ mono = false, children }: BadgeProps) {
  const classes = ['cf-badge', mono ? 'cf-text-mono' : ''].filter(Boolean).join(' ');

  return <span className={classes}>{children}</span>;
}

