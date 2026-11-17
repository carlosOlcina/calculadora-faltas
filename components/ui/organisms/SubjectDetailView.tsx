'use client';

import { useState } from 'react';
import {
  Badge,
  Button,
  Heading,
  Icon,
  InlineLink,
  LiveAnnouncer,
  StatusBanner,
  Text,
} from '../atoms';
import {
  AbsenceFilterBar,
  AbsenceListItem,
  BrandHeader,
  QuickAbsenceControl,
  SubjectStatsPanel,
  type AbsenceFilterValue,
  type AbsenceItemData,
  type QuickAbsenceHours,
} from '../molecules';

export interface SubjectDetailInfo {
  id: string;
  name: string;
  totalHours: number;
  convalidated: boolean;
}

export interface SubjectDetailViewProps {
  userName: string;
  courseName: string;
  subject: SubjectDetailInfo | null;
  absences: AbsenceItemData[];
  loading: boolean;
  notFound: boolean;
  errorMessage: string | null;
  liveMessage: string;
  pendingAddHours: QuickAbsenceHours | null;
  pendingToggleId: string | null;
  pendingDeleteId: string | null;
  pendingConvalidate: boolean;
  pendingLogout: boolean;
  onAddAbsence: (subjectId: string, hours: QuickAbsenceHours) => void;
  onToggleJustified: (absenceId: string, nextJustified: boolean) => void;
  onDeleteAbsence: (absenceId: string) => void;
  onToggleConvalidate: (subjectId: string, nextConvalidated: boolean) => void;
  onLogout: () => void;
}

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat('es-ES', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

function formatAbsenceDate(isoDate: string): string {
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) {
    return isoDate;
  }
  return DATE_TIME_FORMATTER.format(parsed);
}

export function SubjectDetailView({
  userName,
  courseName,
  subject,
  absences,
  loading,
  notFound,
  errorMessage,
  liveMessage,
  pendingAddHours,
  pendingToggleId,
  pendingDeleteId,
  pendingConvalidate,
  pendingLogout,
  onAddAbsence,
  onToggleJustified,
  onDeleteAbsence,
  onToggleConvalidate,
  onLogout,
}: SubjectDetailViewProps) {
  const [filter, setFilter] = useState<AbsenceFilterValue>('all');

  const isAnyPending =
    pendingLogout ||
    pendingConvalidate ||
    pendingAddHours !== null ||
    pendingToggleId !== null ||
    pendingDeleteId !== null;

  const unjustifiedHours = absences
    .filter((item) => !item.justified)
    .reduce((sum, item) => sum + item.hoursMissed, 0);
  const justifiedHours = absences
    .filter((item) => item.justified)
    .reduce((sum, item) => sum + item.hoursMissed, 0);

  const totalHours = subject?.totalHours ?? 0;
  const maxAllowedHours = Math.floor(totalHours * 0.15);
  const remainingHours = Math.max(0, maxAllowedHours - unjustifiedHours);
  const currentPercentage =
    totalHours > 0
      ? Math.round((unjustifiedHours / totalHours) * 1000) / 10
      : 0;

  const filteredAbsences = absences.filter((item) => {
    if (filter === 'unjustified') return !item.justified;
    if (filter === 'justified') return item.justified;
    return true;
  });

  const unjustifiedCount = absences.filter((item) => !item.justified).length;
  const justifiedCount = absences.filter((item) => item.justified).length;

  return (
    <>
      <div className="cf-topbar">
        <div className="cf-topbar-inner">
          <BrandHeader />
          <div className="cf-topbar-meta">
            <div className="cf-topbar-user">
              <Text as="span" variant="strong">
                {userName}
              </Text>
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

        <nav className="cf-detail-backbar" aria-label="Navegación de retorno">
          <InlineLink href="/">
            <Icon name="arrow-left" />
            <span>Volver a asignaturas</span>
          </InlineLink>
        </nav>

        {errorMessage ? (
          <StatusBanner tone="error">{errorMessage}</StatusBanner>
        ) : null}

        {loading ? (
          <div
            className="cf-detail-loading"
            role="status"
            aria-busy="true"
            aria-label="Cargando detalles de la asignatura"
          >
            <Heading level={1} className="cf-sr-only">
              Cargando asignatura
            </Heading>
            <div className="cf-skeleton-card" />
            <div className="cf-summary-list">
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="cf-skeleton-kpi-card" />
              ))}
            </div>
            <div className="cf-skeleton-card" />
          </div>
        ) : notFound || !subject ? (
          <div className="cf-subjects-empty">
            <Heading level={1}>Asignatura no encontrada</Heading>
            <Text variant="muted">
              No pudimos encontrar la asignatura solicitada dentro de tu curso matriculado.
            </Text>
          </div>
        ) : (
          <>
            <div
              className="cf-subject-detail-header"
              data-convalidated={subject.convalidated ? 'true' : 'false'}
            >
              <div className="cf-subject-detail-identity">
                <Heading level={1}>{subject.name}</Heading>
                <div className="cf-subject-detail-meta">
                  <Text as="span" variant="muted">
                    {courseName}
                  </Text>
                  <Badge mono>{subject.totalHours} h lectivas</Badge>
                  {subject.convalidated ? <Badge>Convalidada</Badge> : null}
                </div>
              </div>

              <div className="cf-subject-detail-controls">
                <div className="cf-subject-detail-quick">
                  <Text as="span" variant="hint">
                    Registrar falta rápida
                  </Text>
                  <QuickAbsenceControl
                    subjectId={subject.id}
                    subjectName={subject.name}
                    pendingHours={pendingAddHours}
                    disabled={isAnyPending || subject.convalidated}
                    onAddAbsence={onAddAbsence}
                  />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="compact"
                  disabled={isAnyPending}
                  onClick={() =>
                    onToggleConvalidate(subject.id, !subject.convalidated)
                  }
                >
                  <Icon
                    name={
                      pendingConvalidate
                        ? 'spinner'
                        : subject.convalidated
                          ? 'rotate-ccw'
                          : 'check'
                    }
                  />
                  {pendingConvalidate
                    ? 'Actualizando…'
                    : subject.convalidated
                      ? 'Desconvalidar asignatura'
                      : 'Convalidar asignatura'}
                </Button>
              </div>
            </div>

            <div className="cf-subjects-section">
              <div className="cf-subjects-section-header">
                <Heading level={2} className="cf-subjects-section-title">
                  Estadísticas de la asignatura
                </Heading>
              </div>
              <SubjectStatsPanel
                totalHours={subject.totalHours}
                unjustifiedHours={unjustifiedHours}
                justifiedHours={justifiedHours}
                maxAllowedHours={maxAllowedHours}
                currentPercentage={currentPercentage}
                remainingHours={remainingHours}
                totalRecords={absences.length}
                convalidated={subject.convalidated}
              />
            </div>

            <div className="cf-subjects-section">
              <div className="cf-subjects-section-header">
                <div className="cf-section-title-group">
                  <Heading level={2} className="cf-subjects-section-title">
                    Historial de faltas
                  </Heading>
                  <Badge mono>{String(absences.length)}</Badge>
                </div>

                {absences.length > 0 ? (
                  <AbsenceFilterBar
                    value={filter}
                    totalCount={absences.length}
                    unjustifiedCount={unjustifiedCount}
                    justifiedCount={justifiedCount}
                    onChange={setFilter}
                  />
                ) : null}
              </div>

              {absences.length === 0 ? (
                <div className="cf-subjects-empty">
                  <Text variant="strong">
                    Sin faltas registradas en {subject.name}
                  </Text>
                  <Text variant="muted">
                    {subject.convalidated
                      ? 'Esta asignatura está convalidada. Si necesitas registrar asistencias, desconvalídala primero.'
                      : 'Aún no has anotado ninguna ausencia. Usa los botones +1 h, +2 h o +3 h superiores para registrar una falta.'}
                  </Text>
                </div>
              ) : filteredAbsences.length === 0 ? (
                <div className="cf-subjects-empty">
                  <Text variant="strong">
                    Sin faltas en el filtro seleccionado
                  </Text>
                  <Text variant="muted">
                    No hay registros de faltas{' '}
                    {filter === 'justified' ? 'justificadas' : 'injustificadas'}{' '}
                    en esta asignatura.
                  </Text>
                </div>
              ) : (
                <ul role="list" className="cf-absence-list">
                  {filteredAbsences.map((absence) => (
                    <AbsenceListItem
                      key={absence.id}
                      absence={absence}
                      formattedDate={formatAbsenceDate(absence.createdAt)}
                      pendingToggle={pendingToggleId === absence.id}
                      pendingDelete={pendingDeleteId === absence.id}
                      disabled={isAnyPending}
                      onToggleJustified={onToggleJustified}
                      onDelete={onDeleteAbsence}
                    />
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
