import Link from 'next/link';
import type { ReactNode } from 'react';

export interface InlineLinkProps {
  href: string;
  children: ReactNode;
}

export function InlineLink({ href, children }: InlineLinkProps) {
  return (
    <Link href={href} className="cf-link">
      {children}
    </Link>
  );
}

