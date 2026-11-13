import type { ChangeEventHandler, FocusEventHandler, HTMLInputAutoCompleteAttribute, Ref } from 'react';
import { FieldMessage, Input, Label } from '../atoms';

export interface FormFieldProps {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  onBlur?: FocusEventHandler<HTMLInputElement>;
  inputRef?: Ref<HTMLInputElement>;
  type?: 'text' | 'email';
  placeholder?: string;
  autoComplete?: HTMLInputAutoCompleteAttribute;
  enterKeyHint?: 'next' | 'done' | 'go' | 'send';
  required?: boolean;
  disabled?: boolean;
  hint?: string;
  error?: string;
}

export function FormField({
  id,
  name,
  label,
  value,
  onChange,
  onBlur,
  inputRef,
  type = 'text',
  placeholder,
  autoComplete,
  enterKeyHint,
  required = true,
  disabled = false,
  hint,
  error,
}: FormFieldProps) {
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
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          autoComplete={autoComplete}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint={enterKeyHint}
          required={required}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
        />
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

