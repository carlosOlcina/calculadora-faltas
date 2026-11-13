import { Button, Icon, StatusBanner, Text } from '../atoms';
import { AuthFormHeader, SessionDetailRow } from '../molecules';

export interface SessionOverviewCardProps {
  userName: string;
  courseName: string;
  courseTotalHours: number;
  logoutError: string | null;
  pending: boolean;
  onLogout: () => void;
}

export function SessionOverviewCard({
  userName,
  courseName,
  courseTotalHours,
  logoutError,
  pending,
  onLogout,
}: SessionOverviewCardProps) {
  return (
    <>
      <AuthFormHeader
        title={userName}
        subtitle="Tu sesión está activa y lista para gestionar tus asignaturas."
      />

      {logoutError ? <StatusBanner tone="error">{logoutError}</StatusBanner> : null}

      <div className="cf-summary-list">
        <SessionDetailRow label="Curso" value={courseName} />
        <SessionDetailRow
          label="Duración oficial"
          value={`${courseTotalHours} h`}
          mono
        />
      </div>

      <Text variant="hint">
        Los módulos de asignaturas y registro diario de faltas se conectarán sobre este curso base.
      </Text>

      <Button
        type="button"
        variant="secondary"
        disabled={pending}
        onClick={onLogout}
      >
        {pending ? <Icon name="spinner" /> : null}
        {pending ? 'Cerrando sesión…' : 'Cerrar sesión'}
      </Button>
    </>
  );
}

