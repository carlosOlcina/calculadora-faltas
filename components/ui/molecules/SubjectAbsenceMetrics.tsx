import { Badge, Text } from '../atoms';

export interface SubjectAbsenceMetricsProps {
  totalHours?: number;
  missedHours: number;
  maxAllowedHours: number;
  currentPercentage: number;
  remainingHours: number;
}

function formatPercentage(value: number): string {
  return Number.isInteger(value)
    ? String(value)
    : value.toLocaleString('es-ES', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      });
}

export function SubjectAbsenceMetrics({
  missedHours,
  maxAllowedHours,
  currentPercentage,
  remainingHours,
}: SubjectAbsenceMetricsProps) {
  const isExceeded = missedHours > maxAllowedHours;
  const formattedPercentage = formatPercentage(currentPercentage);

  return (
    <div className="cf-subject-metrics">
      <div className="cf-subject-metrics-row">
        <Badge mono tone={isExceeded ? 'error' : 'neutral'}>
          {formattedPercentage} % / 15 %
        </Badge>
        <Badge mono>
          {missedHours} / {maxAllowedHours} h
        </Badge>
      </div>
      <Text variant="hint">
        {isExceeded
          ? `Límite del 15 % superado (+${missedHours - maxAllowedHours} h)`
          : `Puedes faltar ${remainingHours} h (tope 15 %: ${maxAllowedHours} h)`}
      </Text>
    </div>
  );
}
