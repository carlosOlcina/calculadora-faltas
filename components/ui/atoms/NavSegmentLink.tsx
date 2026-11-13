import Link from 'next/link';
import type { ReactNode } from 'react';

export interface NavSegmentLinkProps {
  href: string;
  active: boolean;
  children: ReactNode;
}

export function NavSegmentLink({ href, active, children }: NavSegmentLinkProps) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className="cf-segment"
    >
      {children}
    </Link>
  );
}

