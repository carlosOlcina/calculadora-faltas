import { Badge, Text } from '../atoms';

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
      <Text as="span" variant="muted">
        {label}
      </Text>
      {mono ? (
        <Badge mono>{value}</Badge>
      ) : (
        <Text as="span" variant="strong">
          {value}
        </Text>
      )}
    </div>
  );
}
