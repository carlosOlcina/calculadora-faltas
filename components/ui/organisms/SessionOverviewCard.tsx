'use client';

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragStartEvent,
  type ScreenReaderInstructions,
} from '@dnd-kit/core';
import {
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { useId, useState } from 'react';
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
  SortableSubjectMenuItem,
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
  pendingReorderId: string | null;
  errorMessage: string | null;
  liveMessage: string;
  pendingLogout: boolean;
  onViewDetails: (subjectId: string) => void;
  onAddAbsence: (subjectId: string, hours: QuickAbsenceHours) => void;
  onToggleConvalidate: (subjectId: string, nextConvalidated: boolean) => void;
  onReorderSubject: (activeSubjectId: string, overSubjectId: string) => void;
  onLogout: () => void;
}

const SCREEN_READER_INSTRUCTIONS: ScreenReaderInstructions = {
  draggable:
    'Para reordenar una asignatura, pulsa la barra espaciadora o Intro, muévete con las flechas y vuelve a pulsar la barra espaciadora o Intro para soltarla.',
};

export function SessionOverviewCard({
  userName,
  courseName,
  courseTotalHours,
  subjects,
  loadingSubjects,
  pendingAbsence,
  pendingConvalidationId,
  pendingReorderId,
  errorMessage,
  liveMessage,
  pendingLogout,
  onViewDetails,
  onAddAbsence,
  onToggleConvalidate,
  onReorderSubject,
  onLogout,
}: SessionOverviewCardProps) {
  const dndId = useId();
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const findSubjectPosition = (subjectId: string | number) => {
    const idx = subjects.findIndex((item) => item.id === String(subjectId));
    return idx === -1
      ? null
      : {
          name: subjects[idx].name,
          position: idx + 1,
        };
  };

  const announcements: Announcements = {
    onDragStart({ active }) {
      const info = findSubjectPosition(active.id);
      if (!info) {
        return undefined;
      }
      return `Se ha agarrado la asignatura ${info.name}. Posición actual ${info.position} de ${subjects.length}.`;
    },
    onDragOver({ active, over }) {
      const activeInfo = findSubjectPosition(active.id);
      if (!activeInfo || !over) {
        return undefined;
      }
      const overInfo = findSubjectPosition(over.id);
      if (!overInfo) {
        return undefined;
      }
      return `${activeInfo.name} está sobre la posición ${overInfo.position} de ${subjects.length}.`;
    },
    onDragEnd({ active, over }) {
      const activeInfo = findSubjectPosition(active.id);
      if (!activeInfo) {
        return undefined;
      }
      if (!over) {
        return `${activeInfo.name} se ha soltado.`;
      }
      const overInfo = findSubjectPosition(over.id);
      if (!overInfo) {
        return `${activeInfo.name} se ha soltado.`;
      }
      return `${activeInfo.name} se ha soltado en la posición ${overInfo.position} de ${subjects.length}.`;
    },
    onDragCancel({ active }) {
      const activeInfo = findSubjectPosition(active.id);
      return activeInfo
        ? `Se ha cancelado el reordenamiento de ${activeInfo.name}.`
        : 'Se ha cancelado el reordenamiento.';
    },
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onReorderSubject(String(active.id), String(over.id));
    }
  };

  const handleDragCancel = () => {
    setActiveDragId(null);
  };

  const activeSubjects = subjects.filter((subject) => !subject.convalidated);
  const convalidatedHours = subjects
    .filter((subject) => subject.convalidated)
    .reduce((sum, subject) => sum + subject.totalHours, 0);
  const effectiveCourseTotalHours = Math.max(
    0,
    courseTotalHours - convalidatedHours,
  );
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
  const reorderDisabled =
    pendingLogout ||
    pendingAbsence !== null ||
    pendingConvalidationId !== null ||
    pendingReorderId !== null;

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

        <div
          className="cf-subjects-section"
          data-dragging={activeDragId ? 'true' : 'false'}
        >
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
            <DndContext
              id={dndId}
              sensors={sensors}
              collisionDetection={closestCenter}
              accessibility={{
                announcements,
                screenReaderInstructions: SCREEN_READER_INSTRUCTIONS,
              }}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragCancel={handleDragCancel}
            >
              <SortableContext
                items={subjects.map((subject) => subject.id)}
                strategy={rectSortingStrategy}
              >
                <ul role="list" className="cf-subjects-menu">
                  {subjects.map((subject) => (
                    <SortableSubjectMenuItem
                      key={subject.id}
                      subject={subject}
                      pendingHours={
                        pendingAbsence?.subjectId === subject.id
                          ? pendingAbsence.hours
                          : null
                      }
                      pendingConvalidation={pendingConvalidationId === subject.id}
                      pendingReorder={pendingReorderId === subject.id}
                      reorderDisabled={reorderDisabled}
                      disabled={
                        pendingLogout ||
                        pendingAbsence?.subjectId === subject.id ||
                        pendingReorderId !== null
                      }
                      onViewDetails={onViewDetails}
                      onAddAbsence={onAddAbsence}
                      onToggleConvalidate={onToggleConvalidate}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>
    </>
  );
}
