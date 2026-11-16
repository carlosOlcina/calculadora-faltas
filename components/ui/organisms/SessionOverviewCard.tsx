import { Badge, Button, Icon, LiveAnnouncer, StatusBanner, Text } from '../atoms';
import {
  AuthFormHeader,
  SessionDetailRow,
  SubjectMenuItem,
  type QuickAbsenceHours,
  type SubjectSummaryItem,
} from '../molecules';

export interface PendingAbsenceState {
  subjectId: string;
  hours: QuickAbsenceHours;
}

export interface SessionOverviewCardProps {
  userName: string;
  courseName: string;
  courseTotalHours: number;
  subjects: SubjectSummaryItem[];
  loadingSubjects: boolean;
  pendingAbsence: PendingAbsenceState | null;
  errorMessage: string | null;
  liveMessage: string;
  pendingLogout: boolean;
  onAddAbsence: (subjectId: string, hours: QuickAbsenceHours) => void;
  onLogout: () => void;
}

export function SessionOverviewCard({
  userName,
  courseName,
  courseTotalHours,
  subjects,
  loadingSubjects,
  pendingAbsence,
  errorMessage,
  liveMessage,
  pendingLogout,
  onAddAbsence,
  onLogout,
}: SessionOverviewCardProps) {
  return (
    <>
      <AuthFormHeader
        title={userName}
        subtitle="Consulta el margen del 15 % de faltas y registra ausencias por asignatura."
      />

      <LiveAnnouncer message={liveMessage} />

      {errorMessage ? <StatusBanner tone="error">{errorMessage}</StatusBanner> : null}

      <div className="cf-summary-list">
        <SessionDetailRow label="Curso" value={courseName} />
        <SessionDetailRow
          label="Duración oficial"
          value={`${courseTotalHours} h`}
          mono
        />
      </div>

      <div className="cf-subjects-section">
        <div className="cf-subjects-section-header">
          <Text as="span" variant="strong">
            Asignaturas
          </Text>
          <Badge mono>{loadingSubjects ? '…' : String(subjects.length)}</Badge>
        </div>

        {loadingSubjects ? (
          <div
            className="cf-skeleton-group"
            role="status"
            aria-busy="true"
            aria-label="Cargando asignaturas"
          >
            <div className="cf-skeleton-block" />
            <div className="cf-skeleton-block" />
            <div className="cf-skeleton-block" />
          </div>
        ) : subjects.length === 0 ? (
          <div className="cf-subjects-empty">
            <Text variant="strong">Sin asignaturas registradas</Text>
            <Text variant="muted">
              Aún no hay asignaturas guardadas en tu curso. Cuando existan en la base de datos, aparecerán aquí con su límite del 15 %.
            </Text>
          </div>
        ) : (
          <ul role="list" className="cf-subjects-menu">
            {subjects.map((subject) => (
              <SubjectMenuItem
                key={subject.id}
                subject={subject}
                pendingHours={
                  pendingAbsence?.subjectId === subject.id
                    ? pendingAbsence.hours
                    : null
                }
                disabled={
                  pendingLogout || pendingAbsence?.subjectId === subject.id
                }
                onAddAbsence={onAddAbsence}
              />
            ))}
          </ul>
        )}
      </div>

      <Button
        type="button"
        variant="secondary"
        disabled={pendingLogout}
        onClick={onLogout}
      >
        {pendingLogout ? <Icon name="spinner" /> : null}
        {pendingLogout ? 'Cerrando sesión…' : 'Cerrar sesión'}
      </Button>
    </>
  );
}

