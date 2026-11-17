import type { ReactNode } from 'react';

export interface BadgeProps {
  mono?: boolean;
  tone?: 'neutral' | 'error' | 'success';
  children: ReactNode;
}

export function Badge({ mono = false, tone = 'neutral', children }: BadgeProps) {
  const classes = ['cf-badge', mono ? 'cf-text-mono' : ''].filter(Boolean).join(' ');

  return (
    <span className={classes} data-tone={tone}>
      {children}
    </span>
  );
}

