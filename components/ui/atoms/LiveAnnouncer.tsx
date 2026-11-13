export interface LiveAnnouncerProps {
  message: string;
}

export function LiveAnnouncer({ message }: LiveAnnouncerProps) {
  return (
    <p aria-live="polite" aria-atomic="true" className="cf-sr-only">
      {message}
    </p>
  );
}

