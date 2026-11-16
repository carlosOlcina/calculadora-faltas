import { Text } from '../atoms';

export interface SessionDetailRowProps {
  label: string;
  value: string;
  mono?: boolean;
}

export function SessionDetailRow({
  label,
  value,
  mono = false,
}: SessionDetailRowProps) {
  return (
    <div className="cf-summary-row">
      <Text as="span" variant="hint">
        {label}
      </Text>
      <Text
        as="span"
        variant="strong"
        className={mono ? 'cf-text-mono' : undefined}
      >
        {value}
      </Text>
    </div>
  );
}
