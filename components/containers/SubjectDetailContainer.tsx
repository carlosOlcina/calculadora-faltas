'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type {
  AbsenceItemData,
  QuickAbsenceHours,
} from '@/components/ui/molecules';
import {
  SubjectDetailView,
  type SubjectDetailInfo,
} from '@/components/ui/organisms';
import { fetchWithAuth } from '@/lib/utils/auth-fetch';
import { readApiErrorMessage } from './authValidation';

interface SubjectDetailApiRecord {
  id: string;
  name: string;
  hours: number;
  courseId: string;
  convalidate?: boolean;
}

interface AbsenceApiRecord {
  id: string;
  userId: string;
  subjectId: string;
  hoursMissed: number;
  justified: boolean;
  createdAt: string;
}

export interface SubjectDetailContainerProps {
  subjectId: string;
  userName: string;
  courseName: string;
}

function isSubjectDetailApiRecord(
  value: unknown,
): value is SubjectDetailApiRecord {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    typeof record.id === 'string' &&
    typeof record.name === 'string' &&
    typeof record.hours === 'number' &&
    typeof record.courseId === 'string' &&
    (record.convalidate === undefined || typeof record.convalidate === 'boolean')
  );
}

function isAbsenceApiRecord(value: unknown): value is AbsenceApiRecord {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    typeof record.id === 'string' &&
    typeof record.userId === 'string' &&
    typeof record.subjectId === 'string' &&
    typeof record.hoursMissed === 'number' &&
    typeof record.justified === 'boolean' &&
    typeof record.createdAt === 'string'
  );
}

function mapAbsenceToItem(record: AbsenceApiRecord): AbsenceItemData {
  return {
    id: record.id,
    hoursMissed: record.hoursMissed,
    justified: record.justified,
    createdAt: record.createdAt,
  };
}

export function SubjectDetailContainer({
  subjectId,
  userName,
  courseName,
}: SubjectDetailContainerProps) {
  const router = useRouter();
  const [subject, setSubject] = useState<SubjectDetailInfo | null>(null);
  const [absences, setAbsences] = useState<AbsenceItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [liveMessage, setLiveMessage] = useState('');
  const [pendingAddHours, setPendingAddHours] =
    useState<QuickAbsenceHours | null>(null);
  const [pendingToggleId, setPendingToggleId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingConvalidate, setPendingConvalidate] = useState(false);
  const [pendingLogout, setPendingLogout] = useState(false);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function loadSubjectDetail() {
      let redirected = false;
      setLoading(true);
      setNotFound(false);
      setErrorMessage(null);

      try {
        const encodedId = encodeURIComponent(subjectId);
        const [subjectResult, absencesResult] = await Promise.all([
          fetchWithAuth(`/api/subjects/${encodedId}`, {
            signal: controller.signal,
          }),
          fetchWithAuth(`/api/absences?subjectId=${encodedId}`, {
            signal: controller.signal,
          }),
        ]);

        if (!active) {
          return;
        }

        if (subjectResult.unauthorized || absencesResult.unauthorized) {
          redirected = true;
          router.replace('/login');
          router.refresh();
          return;
        }

        if (subjectResult.response.status === 404) {
          setNotFound(true);
          return;
        }

        if (!subjectResult.response.ok) {
          const apiError = await readApiErrorMessage(subjectResult.response);
          setErrorMessage(
            apiError.error ?? 'No pudimos cargar los datos de la asignatura.',
          );
          return;
        }

        if (!absencesResult.response.ok) {
          const apiError = await readApiErrorMessage(absencesResult.response);
          setErrorMessage(
            apiError.error ?? 'No pudimos cargar el historial de faltas.',
          );
          return;
        }

        const [subjectJson, absencesJson]: [unknown, unknown] =
          await Promise.all([
            subjectResult.response.json(),
            absencesResult.response.json(),
          ]);

        if (!active) {
          return;
        }

        const rawSubject =
          typeof subjectJson === 'object' &&
          subjectJson !== null &&
          'subject' in subjectJson &&
          isSubjectDetailApiRecord(
            (subjectJson as { subject?: unknown }).subject,
          )
            ? (subjectJson as { subject: SubjectDetailApiRecord }).subject
            : null;

        if (!rawSubject) {
          setNotFound(true);
          return;
        }

        const rawAbsences =
          typeof absencesJson === 'object' &&
          absencesJson !== null &&
          Array.isArray((absencesJson as { absences?: unknown }).absences)
            ? (absencesJson as { absences: unknown[] }).absences
                .filter(isAbsenceApiRecord)
                .map(mapAbsenceToItem)
            : [];

        setSubject({
          id: rawSubject.id,
          name: rawSubject.name,
          totalHours: rawSubject.hours,
          convalidated: Boolean(rawSubject.convalidate),
        });
        setAbsences(rawAbsences);
      } catch (error) {
        if (
          !active ||
          (error instanceof DOMException && error.name === 'AbortError')
        ) {
          return;
        }

        setErrorMessage(
          'No se pudo conectar con el servidor para cargar la asignatura.',
        );
      } finally {
        if (active && !redirected) {
          setLoading(false);
        }
      }
    }

    void loadSubjectDetail();

    return () => {
      active = false;
      controller.abort();
      setPendingAddHours(null);
      setPendingToggleId(null);
      setPendingDeleteId(null);
      setPendingConvalidate(false);
      setPendingLogout(false);
      setErrorMessage(null);
      setLiveMessage('');
    };
  }, [router, subjectId]);

  const isBusy =
    pendingAddHours !== null ||
    pendingToggleId !== null ||
    pendingDeleteId !== null ||
    pendingConvalidate ||
    pendingLogout;

  const handleAddAbsence = async (
    targetSubjectId: string,
    hours: QuickAbsenceHours,
  ) => {
    if (isBusy || !subject || subject.convalidated) {
      return;
    }

    let redirected = false;
    setPendingAddHours(hours);
    setErrorMessage(null);

    try {
      const { response, unauthorized } = await fetchWithAuth('/api/absences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId: targetSubjectId,
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
      const created =
        typeof payload === 'object' &&
        payload !== null &&
        'absence' in payload &&
        isAbsenceApiRecord((payload as { absence?: unknown }).absence)
          ? mapAbsenceToItem((payload as { absence: AbsenceApiRecord }).absence)
          : null;

      if (!created) {
        setErrorMessage(
          'La respuesta del servidor no incluyó la falta registrada.',
        );
        return;
      }

      setAbsences((prev) => [created, ...prev]);
      const prefix = hours === 1 ? 'Añadida 1 h' : `Añadidas ${hours} h`;
      setLiveMessage(`${prefix} de falta en ${subject.name}.`);
    } catch {
      setErrorMessage(
        'No se pudo conectar con el servidor para registrar la falta.',
      );
    } finally {
      if (!redirected) {
        setPendingAddHours(null);
      }
    }
  };

  const handleToggleJustified = async (
    absenceId: string,
    nextJustified: boolean,
  ) => {
    if (isBusy) {
      return;
    }

    let redirected = false;
    setPendingToggleId(absenceId);
    setErrorMessage(null);

    try {
      const { response, unauthorized } = await fetchWithAuth(
        `/api/absences/${encodeURIComponent(absenceId)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ justified: nextJustified }),
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
            'No se pudo actualizar el estado de la falta. Inténtalo de nuevo.',
        );
        return;
      }

      const payload: unknown = await response.json();
      const updated =
        typeof payload === 'object' &&
        payload !== null &&
        'absence' in payload &&
        isAbsenceApiRecord((payload as { absence?: unknown }).absence)
          ? mapAbsenceToItem((payload as { absence: AbsenceApiRecord }).absence)
          : null;

      setAbsences((prev) =>
        prev.map((item) =>
          item.id === absenceId
            ? (updated ?? { ...item, justified: nextJustified })
            : item,
        ),
      );

      setLiveMessage(
        nextJustified
          ? 'Falta marcada como justificada.'
          : 'Falta marcada como injustificada.',
      );
    } catch {
      setErrorMessage(
        'No se pudo conectar con el servidor para actualizar la falta.',
      );
    } finally {
      if (!redirected) {
        setPendingToggleId(null);
      }
    }
  };

  const handleDeleteAbsence = async (absenceId: string) => {
    if (isBusy) {
      return;
    }

    let redirected = false;
    setPendingDeleteId(absenceId);
    setErrorMessage(null);

    try {
      const { response, unauthorized } = await fetchWithAuth(
        `/api/absences/${encodeURIComponent(absenceId)}`,
        {
          method: 'DELETE',
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
          apiError.error ?? 'No se pudo eliminar la falta. Inténtalo de nuevo.',
        );
        return;
      }

      const removed = absences.find((item) => item.id === absenceId);
      setAbsences((prev) => prev.filter((item) => item.id !== absenceId));
      setLiveMessage(
        removed
          ? `Falta de ${removed.hoursMissed} h eliminada.`
          : 'Falta eliminada.',
      );
    } catch {
      setErrorMessage(
        'No se pudo conectar con el servidor para eliminar la falta.',
      );
    } finally {
      if (!redirected) {
        setPendingDeleteId(null);
      }
    }
  };

  const handleToggleConvalidate = async (
    targetSubjectId: string,
    nextConvalidated: boolean,
  ) => {
    if (isBusy || !subject) {
      return;
    }

    let redirected = false;
    setPendingConvalidate(true);
    setErrorMessage(null);

    try {
      const { response, unauthorized } = await fetchWithAuth(
        `/api/subjects/${encodeURIComponent(targetSubjectId)}/convalidate`,
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
              ? 'No se pudo convalidar la asignatura.'
              : 'No se pudo desconvalidar la asignatura.'),
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

      setSubject((prev) =>
        prev ? { ...prev, convalidated: confirmedConvalidate } : prev,
      );
      setLiveMessage(
        confirmedConvalidate
          ? `Asignatura ${subject.name} convalidada.`
          : `Asignatura ${subject.name} desconvalidada.`,
      );
    } catch {
      setErrorMessage(
        'No se pudo conectar con el servidor para actualizar la convalidación.',
      );
    } finally {
      if (!redirected) {
        setPendingConvalidate(false);
      }
    }
  };

  const handleLogout = async () => {
    if (isBusy) {
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
    <SubjectDetailView
      userName={userName}
      courseName={courseName}
      subject={subject}
      absences={absences}
      loading={loading}
      notFound={notFound}
      errorMessage={errorMessage}
      liveMessage={liveMessage}
      pendingAddHours={pendingAddHours}
      pendingToggleId={pendingToggleId}
      pendingDeleteId={pendingDeleteId}
      pendingConvalidate={pendingConvalidate}
      pendingLogout={pendingLogout}
      onAddAbsence={handleAddAbsence}
      onToggleJustified={handleToggleJustified}
      onDeleteAbsence={handleDeleteAbsence}
      onToggleConvalidate={handleToggleConvalidate}
      onLogout={handleLogout}
    />
  );
}
