import type { ReactNode } from 'react';

export interface FieldMessageProps {
  id: string;
  tone?: 'error' | 'hint';
  children: ReactNode;
}

export function FieldMessage({ id, tone = 'error', children }: FieldMessageProps) {
  return (
    <p id={id} className={tone === 'error' ? 'cf-field-error' : 'cf-text-hint'}>
      {children}
    </p>
  );
}

