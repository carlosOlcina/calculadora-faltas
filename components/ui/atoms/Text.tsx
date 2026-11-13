import type { ReactNode } from 'react';

export interface TextProps {
  variant?: 'muted' | 'hint' | 'mono' | 'strong';
  as?: 'p' | 'span';
  id?: string;
  className?: string;
  children: ReactNode;
}

const VARIANT_CLASSES: Record<NonNullable<TextProps['variant']>, string> = {
  muted: 'cf-text-muted',
  hint: 'cf-text-hint',
  mono: 'cf-text-mono',
  strong: 'cf-summary-value',
};

export function Text({
  variant = 'muted',
  as = 'p',
  id,
  className,
  children,
}: TextProps) {
  const Tag = as;
  const classes = [VARIANT_CLASSES[variant], className ?? ''].filter(Boolean).join(' ');

  return (
    <Tag id={id} className={classes}>
      {children}
    </Tag>
  );
}

