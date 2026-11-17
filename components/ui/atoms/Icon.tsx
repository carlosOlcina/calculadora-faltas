export type IconName =
  | 'arrow-left'
  | 'eye'
  | 'eye-off'
  | 'chevron-down'
  | 'alert-circle'
  | 'check'
  | 'file-text'
  | 'log-out'
  | 'more-vertical'
  | 'rotate-ccw'
  | 'spinner'
  | 'trash';

export interface IconProps {
  name: IconName;
  className?: string;
}

const ICON_PATHS: Record<IconName, string[]> = {
  'arrow-left': ['M19 12H5', 'M12 19l-7-7 7-7'],
  eye: ['M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z', 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z'],
  'eye-off': ['M9.88 9.88a3 3 0 1 0 4.24 4.24', 'M10.73 5.08A10.43 10.43 0 0 1 12 5c6.5 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68', 'M6.61 6.61A13.53 13.53 0 0 0 2 12s3.5 7 10 7a9.74 9.74 0 0 0 5.39-1.61', 'M2 2l20 20'],
  'chevron-down': ['M6 9l6 6 6-6'],
  'alert-circle': ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z', 'M12 8v4', 'M12 16h.01'],
  check: ['M5 12.5 9.5 17 19 7.5'],
  'file-text': ['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z', 'M14 2v6h6', 'M16 13H8', 'M16 17H8', 'M10 9H8'],
  'log-out': ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'M16 17l5-5-5-5', 'M21 12H9'],
  'more-vertical': ['M12 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z', 'M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z', 'M12 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z'],
  'rotate-ccw': ['M3 12a9 9 0 1 0 3-6.7L3 8', 'M3 3v5h5'],
  spinner: ['M21 12a9 9 0 1 1-6.22-8.56'],
  trash: ['M3 6h18', 'M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2', 'M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6', 'M10 11v6', 'M14 11v6'],
};

export function Icon({ name, className }: IconProps) {
  const classes = ['cf-icon', name === 'spinner' ? 'cf-spinner' : '', className ?? ''].filter(Boolean).join(' ');
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={classes}>
      {ICON_PATHS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

