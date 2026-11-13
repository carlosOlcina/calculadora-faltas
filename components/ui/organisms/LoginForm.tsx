import type {
  ChangeEventHandler,
  FocusEventHandler,
  FormEventHandler,
  Ref,
} from 'react';
import { Button, Icon, LiveAnnouncer, StatusBanner } from '../atoms';
import {
  AuthFormFooter,
  AuthFormHeader,
  FormField,
  PasswordField,
} from '../molecules';

export interface LoginFormProps {
  name: string;
  password: string;
  showPassword: boolean;
  fieldErrors: {
    name?: string;
    password?: string;
  };
  serverError: string | null;
  liveMessage: string;
  pending: boolean;
  nameInputRef?: Ref<HTMLInputElement>;
  passwordInputRef?: Ref<HTMLInputElement>;
  onNameChange: ChangeEventHandler<HTMLInputElement>;
  onNameBlur: FocusEventHandler<HTMLInputElement>;
  onPasswordChange: ChangeEventHandler<HTMLInputElement>;
  onPasswordBlur: FocusEventHandler<HTMLInputElement>;
  onTogglePassword: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
}

export function LoginForm({
  name,
  password,
  showPassword,
  fieldErrors,
  serverError,
  liveMessage,
  pending,
  nameInputRef,
  passwordInputRef,
  onNameChange,
  onNameBlur,
  onPasswordChange,
  onPasswordBlur,
  onTogglePassword,
  onSubmit,
}: LoginFormProps) {
  return (
    <>
      <AuthFormHeader
        title="Iniciar sesión"
        subtitle="Accede con tu usuario para consultar tus faltas."
      />

      {serverError ? <StatusBanner tone="error">{serverError}</StatusBanner> : null}

      <form className="cf-form" onSubmit={onSubmit} noValidate>
        <FormField
          id="login-username"
          name="username"
          label="Nombre de usuario"
          value={name}
          onChange={onNameChange}
          onBlur={onNameBlur}
          inputRef={nameInputRef}
          autoComplete="username"
          placeholder="ej. lucia.martinez"
          enterKeyHint="next"
          disabled={pending}
          error={fieldErrors.name}
        />

        <PasswordField
          id="login-password"
          name="password"
          label="Contraseña"
          value={password}
          visible={showPassword}
          onChange={onPasswordChange}
          onBlur={onPasswordBlur}
          onToggleVisible={onTogglePassword}
          inputRef={passwordInputRef}
          autoComplete="current-password"
          placeholder="Tu contraseña"
          enterKeyHint="done"
          disabled={pending}
          error={fieldErrors.password}
        />

        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? <Icon name="spinner" /> : null}
          {pending ? 'Iniciando sesión…' : 'Iniciar sesión'}
        </Button>

        <LiveAnnouncer message={liveMessage} />
      </form>

      <AuthFormFooter
        prompt="¿Aún no tienes cuenta?"
        linkLabel="Crear cuenta"
        href="/register"
      />
    </>
  );
}

