export interface ProgressBarProps {
  value: number;
  max: number;
  tone?: 'neutral' | 'error';
  label: string;
}

export function ProgressBar({
  value,
  max,
  tone = 'neutral',
  label,
}: ProgressBarProps) {
  const safeMax = max > 0 ? max : 1;
  const clampedValue =
    max > 0 ? Math.min(Math.max(0, value), safeMax) : value > 0 ? 1 : 0;

  return (
    <progress
      className="cf-progress"
      value={clampedValue}
      max={safeMax}
      data-tone={tone}
      aria-label={label}
    />
  );
}
