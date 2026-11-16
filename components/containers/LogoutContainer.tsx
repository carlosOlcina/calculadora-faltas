'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { QuickAbsenceHours, SubjectSummaryItem } from '@/components/ui/molecules';
import {
  SessionOverviewCard,
  type PendingAbsenceState,
} from '@/components/ui/organisms';
import { fetchWithAuth } from '@/lib/utils/auth-fetch';
import { readApiErrorMessage } from './authValidation';

interface SubjectRecord {
  id: string;
  name: string;
  hours: number;
  courseId: string;
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
    typeof record.courseId === 'string'
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
  const [subjects, setSubjects] = useState<SubjectRecord[]>([]);
  const [absences, setAbsences] = useState<AbsenceRecord[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [pendingAbsence, setPendingAbsence] = useState<PendingAbsenceState | null>(
    null,
  );
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
            ? (subjectsJson as { subjects: unknown[] }).subjects.filter(
                isSubjectRecord,
              )
            : [];

        const rawAbsences =
          typeof absencesJson === 'object' &&
          absencesJson !== null &&
          Array.isArray((absencesJson as { absences?: unknown }).absences)
            ? (absencesJson as { absences: unknown[] }).absences.filter(
                isAbsenceRecord,
              )
            : [];

        setSubjects(rawSubjects);
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
      setErrorMessage(null);
      setLiveMessage('');
    };
  }, [router]);

  const hoursBySubject = new Map<string, number>();
  for (const absence of absences) {
    const current = hoursBySubject.get(absence.subjectId) ?? 0;
    hoursBySubject.set(absence.subjectId, current + absence.hoursMissed);
  }

  const subjectSummaries: SubjectSummaryItem[] = subjects.map((subject) => {
    const maxAllowedHours = Math.floor(subject.hours * 0.15);
    const missedHours = hoursBySubject.get(subject.id) ?? 0;
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
      maxAllowedHours,
      currentPercentage,
      remainingHours,
    };
  });

  const handleAddAbsence = async (
    subjectId: string,
    hours: QuickAbsenceHours,
  ) => {
    if (pendingAbsence || pendingLogout) {
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

  const handleLogout = async () => {
    if (pendingLogout || pendingAbsence) {
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
      errorMessage={errorMessage}
      liveMessage={liveMessage}
      pendingLogout={pendingLogout}
      onAddAbsence={handleAddAbsence}
      onLogout={handleLogout}
    />
  );
}
