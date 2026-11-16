import { Icon } from '../atoms';

const QUICK_HOUR_OPTIONS = [1, 2, 3] as const;

export type QuickAbsenceHours = (typeof QUICK_HOUR_OPTIONS)[number];

export interface QuickAbsenceControlProps {
  subjectId: string;
  subjectName: string;
  pendingHours: QuickAbsenceHours | null;
  disabled: boolean;
  onAddAbsence: (subjectId: string, hours: QuickAbsenceHours) => void;
}

export function QuickAbsenceControl({
  subjectId,
  subjectName,
  pendingHours,
  disabled,
  onAddAbsence,
}: QuickAbsenceControlProps) {
  return (
    <div
      className="cf-quick-absence"
      role="group"
      aria-label={`Añadir falta en ${subjectName}`}
    >
      {QUICK_HOUR_OPTIONS.map((hours) => {
        const isPendingOption = pendingHours === hours;

        return (
          <button
            key={hours}
            type="button"
            className="cf-quick-absence-btn"
            disabled={disabled}
            onClick={() => onAddAbsence(subjectId, hours)}
          >
            {isPendingOption ? <Icon name="spinner" /> : null}
            +{hours} h
            <span className="cf-sr-only"> de falta en {subjectName}</span>
          </button>
        );
      })}
    </div>
  );
}
