import type { ButtonHTMLAttributes } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}

export function Button({
  variant = 'primary',
  type = 'button',
  className,
  children,
  ...props
}: ButtonProps) {
  const classes = ['cf-button', className ?? ''].filter(Boolean).join(' ');

  return (
    <button type={type} data-variant={variant} className={classes} {...props}>
      {children}
    </button>
  );
}

