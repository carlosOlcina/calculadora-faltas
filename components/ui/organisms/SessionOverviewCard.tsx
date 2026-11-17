import {
  Badge,
  Button,
  Heading,
  Icon,
  LiveAnnouncer,
  StatusBanner,
  Text,
} from '../atoms';
import {
  BrandHeader,
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
  pendingConvalidationId: string | null;
  errorMessage: string | null;
  liveMessage: string;
  pendingLogout: boolean;
  onViewDetails: (subjectId: string) => void;
  onAddAbsence: (subjectId: string, hours: QuickAbsenceHours) => void;
  onToggleConvalidate: (subjectId: string, nextConvalidated: boolean) => void;
  onLogout: () => void;
}

export function SessionOverviewCard({
  userName,
  courseName,
  courseTotalHours,
  subjects,
  loadingSubjects,
  pendingAbsence,
  pendingConvalidationId,
  errorMessage,
  liveMessage,
  pendingLogout,
  onViewDetails,
  onAddAbsence,
  onToggleConvalidate,
  onLogout,
}: SessionOverviewCardProps) {
  const activeSubjects = subjects.filter((subject) => !subject.convalidated);
  const convalidatedHours = subjects
    .filter((subject) => subject.convalidated)
    .reduce((sum, subject) => sum + subject.totalHours, 0);
  const effectiveCourseTotalHours = Math.max(0, courseTotalHours - convalidatedHours);
  const totalMissedHours = activeSubjects.reduce(
    (sum, subject) => sum + subject.missedHours,
    0,
  );
  const totalMaxAllowedHours = activeSubjects.reduce(
    (sum, subject) => sum + subject.maxAllowedHours,
    0,
  );
  const exceededCount = activeSubjects.filter(
    (subject) => subject.missedHours > subject.maxAllowedHours,
  ).length;

  return (
    <>
      <div className="cf-topbar">
        <div className="cf-topbar-inner">
          <BrandHeader />
          <div className="cf-topbar-meta">
            <div className="cf-topbar-user">
              <Heading level={1}>{userName}</Heading>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="compact"
              disabled={pendingLogout}
              onClick={onLogout}
            >
              <Icon name={pendingLogout ? 'spinner' : 'log-out'} />
              {pendingLogout ? 'Cerrando sesión…' : 'Cerrar sesión'}
            </Button>
          </div>
        </div>
      </div>

      <div className="cf-workspace-body">
        <LiveAnnouncer message={liveMessage} />

        {errorMessage ? (
          <StatusBanner tone="error">{errorMessage}</StatusBanner>
        ) : null}

        <div className="cf-summary-list">
          <SessionDetailRow label="Curso" value={courseName} />
          <SessionDetailRow
            label="Carga lectiva"
            value={
              loadingSubjects
                ? `${courseTotalHours} h`
                : `${effectiveCourseTotalHours} h`
            }
            mono
          />
          <SessionDetailRow
            label="Faltas acumuladas"
            value={
              loadingSubjects
                ? '…'
                : `${totalMissedHours} / ${totalMaxAllowedHours} h`
            }
            mono
          />
          <SessionDetailRow
            label="Asignaturas en límite"
            value={
              loadingSubjects
                ? '…'
                : `${exceededCount} de ${activeSubjects.length}`
            }
            mono
          />
        </div>

        <div className="cf-subjects-section">
          <div className="cf-subjects-section-header">
            <Heading level={2} className="cf-subjects-section-title">
              Asignaturas
            </Heading>
            <Badge mono>
              {loadingSubjects ? '…' : String(subjects.length)}
            </Badge>
          </div>

          {loadingSubjects ? (
            <div
              className="cf-subjects-menu"
              role="status"
              aria-busy="true"
              aria-label="Cargando asignaturas"
            >
              {Array.from({ length: 6 }, (_, index) => (
                <div key={index} className="cf-skeleton-card" />
              ))}
            </div>
          ) : subjects.length === 0 ? (
            <div className="cf-subjects-empty">
              <Text variant="strong">Sin asignaturas registradas</Text>
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
                  pendingConvalidation={pendingConvalidationId === subject.id}
                  disabled={
                    pendingLogout || pendingAbsence?.subjectId === subject.id
                  }
                  onViewDetails={onViewDetails}
                  onAddAbsence={onAddAbsence}
                  onToggleConvalidate={onToggleConvalidate}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}

