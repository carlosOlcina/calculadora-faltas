import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { LoginContainer } from '@/components/containers';
import { AuthCardSkeleton, AuthModeSwitcher } from '@/components/ui/molecules';
import { AuthPageTemplate } from '@/components/ui/templates';
import { getSessionUser } from '@/lib/server/session';

export const metadata: Metadata = {
  title: 'Iniciar sesión',
  description:
    'Inicia sesión en Calculadora de Faltas para revisar tus asignaturas y ausencias.',
};

async function LoginGate() {
  const user = await getSessionUser();
  if (user) {
    redirect('/');
  }

  return <LoginContainer />;
}

export default function LoginPage() {
  return (
    <AuthPageTemplate
      cardLabel="Acceso a Calculadora de Faltas"
      topSlot={<AuthModeSwitcher activeMode="login" />}
    >
      <Suspense fallback={<AuthCardSkeleton fieldCount={2} />}>
        <LoginGate />
      </Suspense>
    </AuthPageTemplate>
  );
}

