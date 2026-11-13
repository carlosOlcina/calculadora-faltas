import { InlineLink, Text } from '../atoms';

export interface AuthFormFooterProps {
  prompt: string;
  linkLabel: string;
  href: string;
}

export function AuthFormFooter({ prompt, linkLabel, href }: AuthFormFooterProps) {
  return (
    <div className="cf-form-footer">
      <Text as="span" variant="muted">
        {prompt}
      </Text>
      <InlineLink href={href}>{linkLabel}</InlineLink>
    </div>
  );
}

