import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { RegisterContainer } from '@/components/containers';
import { AuthCardSkeleton, AuthModeSwitcher } from '@/components/ui/molecules';
import { AuthPageTemplate } from '@/components/ui/templates';
import { courseDal } from '@/lib/server/dal';
import { getSessionUser } from '@/lib/server/session';

export const metadata: Metadata = {
  title: 'Crear cuenta',
  description:
    'Crea tu cuenta en Calculadora de Faltas seleccionando tu curso oficial.',
};

async function RegisterGate() {
  const [user, courses] = await Promise.all([
    getSessionUser(),
    courseDal.listAll(),
  ]);

  if (user) {
    redirect('/');
  }

  const courseOptions = [...courses]
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))
    .map((course) => ({
      id: course.id,
      name: course.name,
      totalHours: course.totalHours,
    }));

  return <RegisterContainer courses={courseOptions} />;
}

export default function RegisterPage() {
  return (
    <AuthPageTemplate
      cardLabel="Registro en Calculadora de Faltas"
      topSlot={<AuthModeSwitcher activeMode="register" />}
    >
      <Suspense fallback={<AuthCardSkeleton fieldCount={3} />}>
        <RegisterGate />
      </Suspense>
    </AuthPageTemplate>
  );
}

