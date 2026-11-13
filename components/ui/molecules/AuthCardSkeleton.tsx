export interface AuthCardSkeletonProps {
  fieldCount?: 2 | 3;
}

export function AuthCardSkeleton({ fieldCount = 2 }: AuthCardSkeletonProps) {
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

