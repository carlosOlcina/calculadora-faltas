import type { ButtonHTMLAttributes } from 'react';

export type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function IconButton({
  type = 'button',
  className,
  children,
  ...props
}: IconButtonProps) {
  const classes = ['cf-input-action', className ?? ''].filter(Boolean).join(' ');

  return (
    <button type={type} className={classes} {...props}>
      {children}
    </button>
  );
}

