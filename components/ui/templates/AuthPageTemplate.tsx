import type { ReactNode } from 'react';
import { BrandHeader } from '../molecules';

export interface AuthPageTemplateProps {
  cardLabel: string;
  topSlot?: ReactNode;
  children: ReactNode;
}

export function AuthPageTemplate({
  cardLabel,
  topSlot,
  children,
}: AuthPageTemplateProps) {
  return (
    <main className="cf-page">
      <div className="cf-shell">
        <BrandHeader />
        <section className="cf-card" aria-label={cardLabel}>
          {topSlot}
          {children}
        </section>
      </div>
    </main>
  );
}

