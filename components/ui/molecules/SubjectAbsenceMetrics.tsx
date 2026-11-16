import { Badge, ProgressBar, Text } from '../atoms';

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
      <ProgressBar
        value={missedHours}
        max={maxAllowedHours}
        tone={isExceeded ? 'error' : 'neutral'}
        label={`Progreso de faltas: ${missedHours} de ${maxAllowedHours} horas`}
      />
      <div className="cf-subject-metrics-row">
        <div className="cf-subject-metrics-badges">
          <Badge mono tone={isExceeded ? 'error' : 'neutral'}>
            {formattedPercentage} % / 15 %
          </Badge>
          <Badge mono>
            {missedHours} / {maxAllowedHours} h
          </Badge>
        </div>
        <Text as="span" variant="hint">
          {isExceeded
            ? `+${missedHours - maxAllowedHours} h sobre límite`
            : `${remainingHours} h disponibles`}
        </Text>
      </div>
    </div>
  );
}
