import type { ChangeEventHandler, FocusEventHandler, Ref } from 'react';
import { FieldMessage, Icon, IconButton, Input, Label } from '../atoms';

export interface PasswordFieldProps {
  id: string;
  name: string;
  label: string;
  value: string;
  visible: boolean;
  onChange: ChangeEventHandler<HTMLInputElement>;
  onBlur?: FocusEventHandler<HTMLInputElement>;
  onToggleVisible: () => void;
  inputRef?: Ref<HTMLInputElement>;
  autoComplete: 'current-password' | 'new-password';
  placeholder?: string;
  enterKeyHint?: 'next' | 'done';
  disabled?: boolean;
  hint?: string;
  error?: string;
}

export function PasswordField({
  id,
  name,
  label,
  value,
  visible,
  onChange,
  onBlur,
  onToggleVisible,
  inputRef,
  autoComplete,
  placeholder,
  enterKeyHint = 'done',
  disabled = false,
  hint,
  error,
}: PasswordFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="cf-field">
      <Label htmlFor={id}>{label}</Label>
      <div className="cf-control-wrap">
        <Input
          ref={inputRef}
          id={id}
          name={name}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          autoComplete={autoComplete}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint={enterKeyHint}
          required
          disabled={disabled}
          hasEndAction
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
        />
        <IconButton
          onClick={onToggleVisible}
          disabled={disabled}
          aria-pressed={visible}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          <Icon name={visible ? 'eye-off' : 'eye'} />
        </IconButton>
      </div>
      {error && errorId ? (
        <FieldMessage id={errorId} tone="error">
          {error}
        </FieldMessage>
      ) : null}
      {hint && hintId ? (
        <FieldMessage id={hintId} tone="hint">
          {hint}
        </FieldMessage>
      ) : null}
    </div>
  );
}

