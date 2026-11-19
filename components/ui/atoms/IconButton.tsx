import type { ButtonHTMLAttributes, Ref } from 'react';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  ref?: Ref<HTMLButtonElement>;
  variant?: 'input-action' | 'menu-trigger' | 'drag-handle';
}

const VARIANT_CLASSES: Record<
  NonNullable<IconButtonProps['variant']>,
  string
> = {
  'input-action': 'cf-input-action',
  'menu-trigger': 'cf-menu-trigger',
  'drag-handle': 'cf-drag-handle',
};

export function IconButton({
  ref,
  type = 'button',
  variant = 'input-action',
  className,
  children,
  ...props
}: IconButtonProps) {
  const baseClass = VARIANT_CLASSES[variant];
  const classes = [baseClass, className ?? ''].filter(Boolean).join(' ');

  return (
    <button ref={ref} type={type} className={classes} {...props}>
      {children}
    </button>
  );
}

