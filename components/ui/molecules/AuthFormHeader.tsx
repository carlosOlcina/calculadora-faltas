import { Heading, Text } from '../atoms';

export interface AuthFormHeaderProps {
  title: string;
  subtitle?: string;
}

export function AuthFormHeader({ title, subtitle }: AuthFormHeaderProps) {
  return (
    <div className="cf-form-header">
      <Heading level={1}>{title}</Heading>
      {subtitle ? <Text variant="muted">{subtitle}</Text> : null}
    </div>
  );
}

