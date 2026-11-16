import type { ReactNode } from 'react';
import { BrandHeader } from '../molecules';

export interface AuthPageTemplateProps {
  cardLabel: string;
  size?: 'default' | 'wide' | 'full';
  topSlot?: ReactNode;
  children: ReactNode;
}

export function AuthPageTemplate({
  cardLabel,
  size = 'default',
  topSlot,
  children,
}: AuthPageTemplateProps) {
  return (
    <main className="cf-page" data-size={size}>
      <div className="cf-shell" data-size={size}>
        {size !== 'full' ? <BrandHeader /> : null}
        <section className="cf-card" data-size={size} aria-label={cardLabel}>
          {topSlot}
          {children}
        </section>
      </div>
    </main>
  );
}

