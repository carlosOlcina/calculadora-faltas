import { Badge, Button, Icon, Text } from '../atoms';

export interface AbsenceItemData {
  id: string;
  hoursMissed: number;
  justified: boolean;
  createdAt: string;
}

export interface AbsenceListItemProps {
  absence: AbsenceItemData;
  formattedDate: string;
  pendingToggle: boolean;
  pendingDelete: boolean;
  disabled: boolean;
  onToggleJustified: (absenceId: string, nextJustified: boolean) => void;
  onDelete: (absenceId: string) => void;
}

export function AbsenceListItem({
  absence,
  formattedDate,
  pendingToggle,
  pendingDelete,
  disabled,
  onToggleJustified,
  onDelete,
}: AbsenceListItemProps) {
  const isBusy = disabled || pendingToggle || pendingDelete;

  return (
    <li
      className="cf-absence-item"
      data-justified={absence.justified ? 'true' : 'false'}
    >
      <div className="cf-absence-info">
        <div className="cf-absence-primary">
          <Text as="span" variant="strong" className="cf-text-mono">
            {absence.hoursMissed} {absence.hoursMissed === 1 ? 'hora' : 'horas'}
          </Text>
          <Badge tone={absence.justified ? 'success' : 'neutral'}>
            {absence.justified ? 'Justificada' : 'Injustificada'}
          </Badge>
        </div>
        <div className="cf-absence-meta">
          <Text as="span" variant="muted" className="cf-text-mono">
            <time dateTime={absence.createdAt}>{formattedDate}</time>
          </Text>
          <Text as="span" variant="hint">
            {absence.justified
              ? 'Informativa · No consume límite del 15 %'
              : 'Computa en el límite del 15 %'}
          </Text>
        </div>
      </div>

      <div className="cf-absence-actions">
        <Button
          type="button"
          variant="secondary"
          size="compact"
          disabled={isBusy}
          onClick={() => onToggleJustified(absence.id, !absence.justified)}
        >
          <Icon
            name={
              pendingToggle
                ? 'spinner'
                : absence.justified
                  ? 'rotate-ccw'
                  : 'check'
            }
          />
          {pendingToggle
            ? 'Actualizando…'
            : absence.justified
              ? 'Marcar injustificada'
              : 'Justificar'}
          <span className="cf-sr-only">
            {' '}
            ({absence.hoursMissed} h del {formattedDate})
          </span>
        </Button>

        <Button
          type="button"
          variant="danger"
          size="compact"
          disabled={isBusy}
          onClick={() => onDelete(absence.id)}
        >
          <Icon name={pendingDelete ? 'spinner' : 'trash'} />
          {pendingDelete ? 'Eliminando…' : 'Eliminar'}
          <span className="cf-sr-only">
            {' '}
            falta de {absence.hoursMissed} h del {formattedDate}
          </span>
        </Button>
      </div>
    </li>
  );
}
