import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { SessionOverviewContainer } from '@/components/containers';
import { AuthCardSkeleton } from '@/components/ui/molecules';
import { AuthPageTemplate } from '@/components/ui/templates';
import { getSessionUser } from '@/lib/server/session';

export const metadata: Metadata = {
  title: 'Tu sesión',
  description: 'Resumen de cuenta y curso activo en Calculadora de Faltas.',
};

async function SessionGate() {
  const user = await getSessionUser();
  if (!user) {
    redirect('/login');
  }

  return (
    <SessionOverviewContainer
      userName={user.name}
      courseName={user.course.name}
      courseTotalHours={user.course.totalHours}
    />
  );
}

export default function HomePage() {
  return (
    <AuthPageTemplate cardLabel="Resumen de sesión" size="full">
      <Suspense fallback={<AuthCardSkeleton variant="workspace" />}>
        <SessionGate />
      </Suspense>
    </AuthPageTemplate>
  );
}
