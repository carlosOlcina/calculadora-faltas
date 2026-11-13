import type { InputHTMLAttributes, Ref } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  hasEndAction?: boolean;
  ref?: Ref<HTMLInputElement>;
}

export function Input({ hasEndAction = false, className, ref, ...props }: InputProps) {
  const classes = [
    'cf-input',
    hasEndAction ? 'cf-input-has-end-action' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return <input ref={ref} className={classes} {...props} />;
}

