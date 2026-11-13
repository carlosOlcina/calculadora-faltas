import { BrandMark } from '../atoms';

export interface BrandHeaderProps {
  title?: string;
}

export function BrandHeader({ title = 'Calculadora de Faltas' }: BrandHeaderProps) {
  return (
    <header className="cf-brand-header">
      <BrandMark />
      <span className="cf-brand-name">{title}</span>
    </header>
  );
}

