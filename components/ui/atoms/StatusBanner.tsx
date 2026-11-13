import type { ReactNode } from 'react';
import { Icon } from './Icon';

export interface StatusBannerProps {
  tone?: 'error' | 'success';
  children: ReactNode;
}

export function StatusBanner({ tone = 'error', children }: StatusBannerProps) {
  return (
    <div
      className="cf-banner"
      data-tone={tone}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      <Icon
        name={tone === 'error' ? 'alert-circle' : 'check'}
        className="cf-banner-icon"
      />
      <span>{children}</span>
    </div>
  );
}

