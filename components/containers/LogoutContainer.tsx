'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SessionOverviewCard } from '@/components/ui/organisms';

export interface SessionOverviewContainerProps {
  userName: string;
  courseName: string;
  courseTotalHours: number;
}

export function SessionOverviewContainer({
  userName,
  courseName,
  courseTotalHours,
}: SessionOverviewContainerProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  useEffect(() => {
    // Limpia el estado transitorio cuando `<Activity>` oculta la ruta tras navegar.
    return () => {
      setPending(false);
      setLogoutError(null);
    };
  }, []);

  const handleLogout = async () => {
    if (pending) {
      return;
    }

    setPending(true);
    setLogoutError(null);

    try {
      const response = await fetch('/api/users/log-out', {
        method: 'POST',
      });

      if (!response.ok) {
        setLogoutError('No se pudo cerrar la sesión. Inténtalo de nuevo.');
        setPending(false);
        return;
      }

      router.replace('/login');
      router.refresh();
    } catch {
      setLogoutError('No se pudo conectar con el servidor al cerrar sesión.');
      setPending(false);
    }
  };

  return (
    <SessionOverviewCard
      userName={userName}
      courseName={courseName}
      courseTotalHours={courseTotalHours}
      logoutError={logoutError}
      pending={pending}
      onLogout={handleLogout}
    />
  );
}
