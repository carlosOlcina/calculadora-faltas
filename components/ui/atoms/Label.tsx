import type { LabelHTMLAttributes } from 'react';

export type LabelProps = LabelHTMLAttributes<HTMLLabelElement>;

export function Label({ className, children, ...props }: LabelProps) {
  const classes = ['cf-label', className ?? ''].filter(Boolean).join(' ');

  return (
    <label className={classes} {...props}>
      {children}
    </label>
  );
}

