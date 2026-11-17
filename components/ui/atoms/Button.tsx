import type { ButtonHTMLAttributes } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'default' | 'compact';
}

export function Button({
  variant = 'primary',
  size = 'default',
  type = 'button',
  className,
  children,
  ...props
}: ButtonProps) {
  const classes = ['cf-button', className ?? ''].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      data-variant={variant}
      data-size={size}
      className={classes}
      {...props}
    >
      {children}
    </button>
  );
}

