import type { Ref, SelectHTMLAttributes } from 'react';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  ref?: Ref<HTMLSelectElement>;
}

export function Select({ className, ref, children, ...props }: SelectProps) {
  const classes = ['cf-select', className ?? ''].filter(Boolean).join(' ');

  return (
    <select ref={ref} className={classes} {...props}>
      {children}
    </select>
  );
}

