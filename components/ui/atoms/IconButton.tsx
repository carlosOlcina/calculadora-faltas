import type { ButtonHTMLAttributes, Ref } from 'react';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  ref?: Ref<HTMLButtonElement>;
  variant?: 'input-action' | 'menu-trigger';
}

export function IconButton({
  ref,
  type = 'button',
  variant = 'input-action',
  className,
  children,
  ...props
}: IconButtonProps) {
  const baseClass = variant === 'menu-trigger' ? 'cf-menu-trigger' : 'cf-input-action';
  const classes = [baseClass, className ?? ''].filter(Boolean).join(' ');

  return (
    <button ref={ref} type={type} className={classes} {...props}>
      {children}
    </button>
  );
}

