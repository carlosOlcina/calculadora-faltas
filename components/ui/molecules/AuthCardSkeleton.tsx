export interface AuthCardSkeletonProps {
  fieldCount?: 2 | 3;
  variant?: 'auth' | 'workspace';
}

export function AuthCardSkeleton({
  fieldCount = 2,
  variant = 'auth',
}: AuthCardSkeletonProps) {
  if (variant === 'workspace') {
    return (
      <div
        className="cf-skeleton-workspace"
        role="status"
        aria-busy="true"
        aria-label="Cargando panel"
      >
        <div className="cf-skeleton-topbar">
          <div className="cf-skeleton-pill" />
          <div className="cf-skeleton-pill" />
        </div>
        <div className="cf-workspace-body">
          <div className="cf-summary-list">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="cf-skeleton-kpi-card" />
            ))}
          </div>
          <div className="cf-subjects-menu">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="cf-skeleton-card" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="cf-skeleton-group"
      role="status"
      aria-busy="true"
      aria-label="Cargando formulario"
    >
      <div className="cf-skeleton-block" />
      <div className="cf-skeleton-line" />
      {Array.from({ length: fieldCount }, (_, index) => (
        <div key={index} className="cf-skeleton-block" />
      ))}
      <div className="cf-skeleton-block" />
    </div>
  );
}

