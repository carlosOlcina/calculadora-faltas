'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { QuickAbsenceHours, SubjectSummaryItem } from '@/components/ui/molecules';
import {
  SessionOverviewCard,
  type PendingAbsenceState,
} from '@/components/ui/organisms';
import { fetchWithAuth } from '@/lib/utils/auth-fetch';
import {
  applySubjectIndices,
  computeDropReorderPlan,
  sortSubjectsByIndex,
  type SubjectIndexMapItem,
} from '@/lib/utils/subject-order';
import { readApiErrorMessage } from './authValidation';

interface SubjectRecord {
  id: string;
  name: string;
  hours: number;
  courseId: string;
  convalidate?: boolean;
  index?: number | null;
}

interface NormalizedSubjectRecord extends SubjectRecord {
  index: number | null;
}

interface AbsenceRecord {
  id: string;
  userId: string;
  subjectId: string;
  hoursMissed: number;
  justified: boolean;
}

export interface SessionOverviewContainerProps {
  userName: string;
  courseName: string;
  courseTotalHours: number;
}

function isSubjectRecord(value: unknown): value is SubjectRecord {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    typeof record.id === 'string' &&
    typeof record.name === 'string' &&
    typeof record.hours === 'number' &&
    typeof record.courseId === 'string' &&
    (record.convalidate === undefined || typeof record.convalidate === 'boolean') &&
    (record.index === undefined ||
      record.index === null ||
      (typeof record.index === 'number' && Number.isFinite(record.index)))
  );
}

function isSubjectIndexMapItem(value: unknown): value is SubjectIndexMapItem {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    typeof record.subjectId === 'string' &&
    typeof record.index === 'number' &&
    Number.isFinite(record.index)
  );
}

function isAbsenceRecord(value: unknown): value is AbsenceRecord {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    typeof record.id === 'string' &&
    typeof record.userId === 'string' &&
    typeof record.subjectId === 'string' &&
    typeof record.hoursMissed === 'number' &&
    typeof record.justified === 'boolean'
  );
}

export function SessionOverviewContainer({
  userName,
  courseName,
  courseTotalHours,
}: SessionOverviewContainerProps) {
  const router = useRouter();
  const [subjects, setSubjects] = useState<NormalizedSubjectRecord[]>([]);
  const [absences, setAbsences] = useState<AbsenceRecord[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [pendingAbsence, setPendingAbsence] = useState<PendingAbsenceState | null>(
    null,
  );
  const [pendingConvalidationId, setPendingConvalidationId] = useState<string | null>(
    null,
  );
  const [pendingReorderId, setPendingReorderId] = useState<string | null>(null);
  const [pendingLogout, setPendingLogout] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [liveMessage, setLiveMessage] = useState('');

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function loadDashboardData() {
      let redirected = false;
      setLoadingSubjects(true);
      setErrorMessage(null);

      try {
        const [subjectsResult, absencesResult] = await Promise.all([
          fetchWithAuth('/api/subjects', { signal: controller.signal }),
          fetchWithAuth('/api/absences', { signal: controller.signal }),
        ]);

        if (!active) {
          return;
        }

        if (subjectsResult.unauthorized || absencesResult.unauthorized) {
          redirected = true;
          router.replace('/login');
          router.refresh();
          return;
        }

        if (!subjectsResult.response.ok) {
          const apiError = await readApiErrorMessage(subjectsResult.response);
          setErrorMessage(
            apiError.error ?? 'No pudimos cargar tus asignaturas.',
          );
          return;
        }

        if (!absencesResult.response.ok) {
          const apiError = await readApiErrorMessage(absencesResult.response);
          setErrorMessage(
            apiError.error ?? 'No pudimos cargar tus faltas registradas.',
          );
          return;
        }

        const [subjectsJson, absencesJson]: [unknown, unknown] = await Promise.all([
          subjectsResult.response.json(),
          absencesResult.response.json(),
        ]);

        if (!active) {
          return;
        }

        const rawSubjects =
          typeof subjectsJson === 'object' &&
          subjectsJson !== null &&
          Array.isArray((subjectsJson as { subjects?: unknown }).subjects)
            ? (subjectsJson as { subjects: unknown[] }).subjects
                .filter(isSubjectRecord)
                .map((subject) => ({
                  ...subject,
                  index: subject.index ?? null,
                }))
            : [];

        const rawAbsences =
          typeof absencesJson === 'object' &&
          absencesJson !== null &&
          Array.isArray((absencesJson as { absences?: unknown }).absences)
            ? (absencesJson as { absences: unknown[] }).absences.filter(
                isAbsenceRecord,
              )
            : [];

        setSubjects(sortSubjectsByIndex(rawSubjects));
        setAbsences(rawAbsences);
      } catch (error) {
        if (
          !active ||
          (error instanceof DOMException && error.name === 'AbortError')
        ) {
          return;
        }

        setErrorMessage(
          'No se pudo conectar con el servidor para cargar tus asignaturas.',
        );
      } finally {
        if (active && !redirected) {
          setLoadingSubjects(false);
        }
      }
    }

    void loadDashboardData();

    return () => {
      active = false;
      controller.abort();
      // Limpia el estado transitorio cuando `<Activity>` oculta la ruta tras navegar.
      setPendingLogout(false);
      setPendingAbsence(null);
      setPendingConvalidationId(null);
      setPendingReorderId(null);
      setErrorMessage(null);
      setLiveMessage('');
    };
  }, [router]);

  const unjustifiedHoursBySubject = new Map<string, number>();
  const justifiedHoursBySubject = new Map<string, number>();
  for (const absence of absences) {
    if (absence.justified) {
      const current = justifiedHoursBySubject.get(absence.subjectId) ?? 0;
      justifiedHoursBySubject.set(absence.subjectId, current + absence.hoursMissed);
    } else {
      const current = unjustifiedHoursBySubject.get(absence.subjectId) ?? 0;
      unjustifiedHoursBySubject.set(absence.subjectId, current + absence.hoursMissed);
    }
  }

  const subjectSummaries: SubjectSummaryItem[] = subjects.map((subject) => {
    const maxAllowedHours = Math.floor(subject.hours * 0.15);
    const missedHours = unjustifiedHoursBySubject.get(subject.id) ?? 0;
    const justifiedHours = justifiedHoursBySubject.get(subject.id) ?? 0;
    const remainingHours = Math.max(0, maxAllowedHours - missedHours);
    const currentPercentage =
      subject.hours > 0
        ? Math.round((missedHours / subject.hours) * 1000) / 10
        : 0;

    return {
      id: subject.id,
      name: subject.name,
      totalHours: subject.hours,
      missedHours,
      justifiedHours,
      maxAllowedHours,
      currentPercentage,
      remainingHours,
      convalidated: Boolean(subject.convalidate),
      index: subject.index,
    };
  });

  const handleViewDetails = (subjectId: string) => {
    router.push(`/subjects/${subjectId}`);
  };

  const handleAddAbsence = async (
    subjectId: string,
    hours: QuickAbsenceHours,
  ) => {
    const targetSubject = subjects.find((item) => item.id === subjectId);
    if (
      pendingAbsence ||
      pendingConvalidationId ||
      pendingReorderId ||
      pendingLogout ||
      targetSubject?.convalidate === true
    ) {
      return;
    }

    let redirected = false;
    setPendingAbsence({ subjectId, hours });
    setErrorMessage(null);

    try {
      const { response, unauthorized } = await fetchWithAuth('/api/absences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId,
          hoursMissed: hours,
          justified: false,
        }),
      });

      if (unauthorized) {
        redirected = true;
        router.replace('/login');
        router.refresh();
        return;
      }

      if (!response.ok) {
        const apiError = await readApiErrorMessage(response);
        setErrorMessage(
          apiError.error ?? 'No se pudo registrar la falta. Inténtalo de nuevo.',
        );
        return;
      }

      const payload: unknown = await response.json();
      const createdAbsence =
        typeof payload === 'object' &&
        payload !== null &&
        'absence' in payload &&
        isAbsenceRecord((payload as { absence?: unknown }).absence)
          ? (payload as { absence: AbsenceRecord }).absence
          : null;

      if (!createdAbsence) {
        setErrorMessage('La respuesta del servidor no incluyó la falta registrada.');
        return;
      }

      setAbsences((prev) => [createdAbsence, ...prev]);

      const subjectName =
        subjects.find((item) => item.id === subjectId)?.name ?? 'la asignatura';
      const prefix = hours === 1 ? 'Añadida 1 h' : `Añadidas ${hours} h`;
      setLiveMessage(`${prefix} de falta en ${subjectName}.`);
    } catch {
      setErrorMessage(
        'No se pudo conectar con el servidor para registrar la falta.',
      );
    } finally {
      if (!redirected) {
        setPendingAbsence(null);
      }
    }
  };

  const handleToggleConvalidate = async (
    subjectId: string,
    nextConvalidated: boolean,
  ) => {
    if (
      pendingConvalidationId ||
      pendingAbsence ||
      pendingReorderId ||
      pendingLogout
    ) {
      return;
    }

    let redirected = false;
    setPendingConvalidationId(subjectId);
    setErrorMessage(null);

    try {
      const { response, unauthorized } = await fetchWithAuth(
        `/api/subjects/${subjectId}/convalidate`,
        {
          method: nextConvalidated ? 'POST' : 'DELETE',
        },
      );

      if (unauthorized) {
        redirected = true;
        router.replace('/login');
        router.refresh();
        return;
      }

      if (!response.ok) {
        const apiError = await readApiErrorMessage(response);
        setErrorMessage(
          apiError.error ??
            (nextConvalidated
              ? 'No se pudo convalidar la asignatura. Inténtalo de nuevo.'
              : 'No se pudo desconvalidar la asignatura. Inténtalo de nuevo.'),
        );
        return;
      }

      const payload: unknown = await response.json();
      const confirmedConvalidate =
        typeof payload === 'object' &&
        payload !== null &&
        'convalidate' in payload &&
        typeof (payload as { convalidate?: unknown }).convalidate === 'boolean'
          ? (payload as { convalidate: boolean }).convalidate
          : nextConvalidated;

      setSubjects((prev) =>
        prev.map((item) =>
          item.id === subjectId
            ? { ...item, convalidate: confirmedConvalidate }
            : item,
        ),
      );

      const subjectName =
        subjects.find((item) => item.id === subjectId)?.name ?? 'la asignatura';
      setLiveMessage(
        confirmedConvalidate
          ? `Asignatura ${subjectName} convalidada.`
          : `Asignatura ${subjectName} desconvalidada.`,
      );
    } catch {
      setErrorMessage(
        'No se pudo conectar con el servidor para actualizar la convalidación.',
      );
    } finally {
      if (!redirected) {
        setPendingConvalidationId(null);
      }
    }
  };

  const handleReorderSubject = async (
    activeSubjectId: string,
    overSubjectId: string,
  ) => {
    if (
      pendingReorderId ||
      pendingAbsence ||
      pendingConvalidationId ||
      pendingLogout
    ) {
      return;
    }

    const dropPlan = computeDropReorderPlan(
      subjects,
      activeSubjectId,
      overSubjectId,
    );
    if (!dropPlan) {
      return;
    }

    const oldIndex = subjects.findIndex((item) => item.id === activeSubjectId);
    const newIndex = subjects.findIndex((item) => item.id === overSubjectId);
    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const previousSubjects = subjects;
    const optimisticSubjects = [...subjects];
    const [movedSubject] = optimisticSubjects.splice(oldIndex, 1);
    optimisticSubjects.splice(newIndex, 0, movedSubject);

    let redirected = false;
    setSubjects(optimisticSubjects);
    setPendingReorderId(activeSubjectId);
    setErrorMessage(null);

    const requestBody =
      dropPlan.precedingSubjectIds.length > 0
        ? {
            index: dropPlan.requestedIndex,
            precedingSubjectIds: dropPlan.precedingSubjectIds,
          }
        : {
            index: dropPlan.requestedIndex,
          };

    try {
      const { response, unauthorized } = await fetchWithAuth(
        `/api/subjects/${activeSubjectId}/index`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        },
      );

      if (unauthorized) {
        redirected = true;
        router.replace('/login');
        router.refresh();
        return;
      }

      if (!response.ok) {
        setSubjects(previousSubjects);
        const apiError = await readApiErrorMessage(response);
        setErrorMessage(
          apiError.error ??
            'No se pudo guardar el nuevo orden de las asignaturas.',
        );
        return;
      }

      const payload: unknown = await response.json();
      const payloadRecord =
        typeof payload === 'object' && payload !== null
          ? (payload as Record<string, unknown>)
          : null;

      const assignedIndex =
        payloadRecord &&
        typeof payloadRecord.index === 'number' &&
        Number.isFinite(payloadRecord.index)
          ? payloadRecord.index
          : dropPlan.requestedIndex;

      const rawIndices =
        payloadRecord && Array.isArray(payloadRecord.indices)
          ? payloadRecord.indices.filter(isSubjectIndexMapItem)
          : [];

      if (rawIndices.length > 0) {
        setSubjects(applySubjectIndices(previousSubjects, rawIndices));
      } else {
        setSubjects(
          sortSubjectsByIndex(
            previousSubjects.map((item) =>
              item.id === activeSubjectId
                ? { ...item, index: assignedIndex }
                : item,
            ),
          ),
        );
      }

      const subjectName =
        previousSubjects.find((item) => item.id === activeSubjectId)?.name ??
        'la asignatura';
      setLiveMessage(
        `${subjectName} se ha movido a la posición ${assignedIndex}.`,
      );
    } catch {
      setSubjects(previousSubjects);
      setErrorMessage(
        'No se pudo conectar con el servidor para guardar el orden.',
      );
    } finally {
      if (!redirected) {
        setPendingReorderId(null);
      }
    }
  };

  const handleLogout = async () => {
    if (
      pendingLogout ||
      pendingAbsence ||
      pendingConvalidationId ||
      pendingReorderId
    ) {
      return;
    }

    setPendingLogout(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/users/log-out', {
        method: 'POST',
      });

      if (!response.ok) {
        setErrorMessage('No se pudo cerrar la sesión. Inténtalo de nuevo.');
        setPendingLogout(false);
        return;
      }

      router.replace('/login');
      router.refresh();
    } catch {
      setErrorMessage('No se pudo conectar con el servidor al cerrar sesión.');
      setPendingLogout(false);
    }
  };

  return (
    <SessionOverviewCard
      userName={userName}
      courseName={courseName}
      courseTotalHours={courseTotalHours}
      subjects={subjectSummaries}
      loadingSubjects={loadingSubjects}
      pendingAbsence={pendingAbsence}
      pendingConvalidationId={pendingConvalidationId}
      pendingReorderId={pendingReorderId}
      errorMessage={errorMessage}
      liveMessage={liveMessage}
      pendingLogout={pendingLogout}
      onViewDetails={handleViewDetails}
      onAddAbsence={handleAddAbsence}
      onToggleConvalidate={handleToggleConvalidate}
      onReorderSubject={handleReorderSubject}
      onLogout={handleLogout}
    />
  );
}
