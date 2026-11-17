import { Badge, ProgressBar, Text } from '../atoms';
import { SessionDetailRow } from './SessionDetailRow';

export interface SubjectStatsPanelProps {
  totalHours: number;
  unjustifiedHours: number;
  justifiedHours: number;
  maxAllowedHours: number;
  currentPercentage: number;
  remainingHours: number;
  totalRecords: number;
  convalidated: boolean;
}

function formatPercentage(value: number): string {
  return Number.isInteger(value)
    ? String(value)
    : value.toLocaleString('es-ES', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      });
}

export function SubjectStatsPanel({
  totalHours,
  unjustifiedHours,
  justifiedHours,
  maxAllowedHours,
  currentPercentage,
  remainingHours,
  totalRecords,
  convalidated,
}: SubjectStatsPanelProps) {
  const isExceeded = !convalidated && unjustifiedHours > maxAllowedHours;
  const formattedPercentage = formatPercentage(currentPercentage);
  const totalLoggedHours = unjustifiedHours + justifiedHours;

  return (
    <div className="cf-stats-panel" data-convalidated={convalidated ? 'true' : 'false'}>
      <div className="cf-summary-list">
        <SessionDetailRow label="Carga lectiva" value={`${totalHours} h`} mono />
        <SessionDetailRow
          label="Faltas injustificadas (15 %)"
          value={`${unjustifiedHours} / ${maxAllowedHours} h`}
          mono
        />
        <SessionDetailRow
          label="Faltas justificadas"
          value={`${justifiedHours} h`}
          mono
        />
        <SessionDetailRow
          label="Margen disponible"
          value={
            convalidated
              ? 'Convalidada'
              : isExceeded
                ? `+${unjustifiedHours - maxAllowedHours} h sobre límite`
                : `${remainingHours} h restantes`
          }
          mono={!convalidated}
        />
      </div>

      <div
        className="cf-stats-meter"
        data-tone={isExceeded ? 'error' : 'neutral'}
      >
        <div className="cf-subject-metrics-row">
          <div className="cf-subject-metrics-badges">
            <Badge mono tone={isExceeded ? 'error' : 'neutral'}>
              {formattedPercentage} % / 15 % límite
            </Badge>
            <Badge mono>
              {totalRecords} {totalRecords === 1 ? 'registro' : 'registros'} · {totalLoggedHours} h totales
            </Badge>
            {justifiedHours > 0 ? (
              <Badge mono tone="success">
                {justifiedHours} h justificadas no descuentan
              </Badge>
            ) : null}
          </div>
          <Text as="span" variant="hint">
            Solo las faltas injustificadas consumen el límite de evaluación continua.
          </Text>
        </div>
        <ProgressBar
          value={unjustifiedHours}
          max={maxAllowedHours}
          tone={isExceeded ? 'error' : 'neutral'}
          label={`Progreso de faltas injustificadas: ${unjustifiedHours} de ${maxAllowedHours} horas`}
        />
      </div>
    </div>
  );
}
