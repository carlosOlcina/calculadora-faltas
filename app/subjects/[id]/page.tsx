import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { SubjectDetailContainer } from '@/components/containers';
import { AuthCardSkeleton } from '@/components/ui/molecules';
import { AuthPageTemplate } from '@/components/ui/templates';
import { getSessionUser } from '@/lib/server/session';

export const metadata: Metadata = {
  title: 'Detalle de asignatura',
  description:
    'Estadísticas de asistencia y registro de faltas por asignatura en Calculadora de Faltas.',
};

interface SubjectDetailPageProps {
  params: Promise<{ id: string }>;
}

async function SubjectDetailGate({ params }: SubjectDetailPageProps) {
  const [{ id }, user] = await Promise.all([params, getSessionUser()]);
  if (!user) {
    redirect('/login');
  }

  return (
    <SubjectDetailContainer
      subjectId={id}
      userName={user.name}
      courseName={user.course.name}
    />
  );
}

export default function SubjectDetailPage({ params }: SubjectDetailPageProps) {
  return (
    <AuthPageTemplate cardLabel="Detalle de asignatura" size="full">
      <Suspense fallback={<AuthCardSkeleton variant="workspace" />}>
        <SubjectDetailGate params={params} />
      </Suspense>
    </AuthPageTemplate>
  );
}
