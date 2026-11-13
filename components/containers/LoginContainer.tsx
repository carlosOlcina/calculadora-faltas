'use client';

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { LoginForm } from '@/components/ui/organisms';
import {
  buildValidationSummary,
  readApiErrorMessage,
  validatePassword,
  validateUsername,
  type AuthFieldErrorMap,
} from './authValidation';

type LoginField = 'name' | 'password';

export function LoginContainer() {
  const router = useRouter();
  const nameInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [dirtyFields, setDirtyFields] = useState<Partial<Record<LoginField, boolean>>>({});
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrorMap<LoginField>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [liveMessage, setLiveMessage] = useState('');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    // Reinicia credenciales y estado de envio si `<Activity>` preserva la ruta oculta.
    return () => {
      setPending(false);
      setPassword('');
      setShowPassword(false);
      setServerError(null);
    };
  }, []);

  const handleFieldChange = (field: LoginField, nextValue: string) => {
    setServerError(null);
    setDirtyFields((prev) => (prev[field] ? prev : { ...prev, [field]: true }));

    if (field === 'name') {
      setName(nextValue);
      if (fieldErrors.name && !validateUsername(nextValue)) {
        setFieldErrors((prev) => ({ ...prev, name: undefined }));
      }
      return;
    }

    setPassword(nextValue);
    if (fieldErrors.password && !validatePassword(nextValue)) {
      setFieldErrors((prev) => ({ ...prev, password: undefined }));
    }
  };

  const handleFieldBlur = (field: LoginField) => {
    if (!dirtyFields[field]) {
      return;
    }

    const message =
      field === 'name' ? validateUsername(name) : validatePassword(password);
    setFieldErrors((prev) => ({ ...prev, [field]: message }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) {
      return;
    }

    const nameError = validateUsername(name);
    const passwordError = validatePassword(password);

    if (nameError || passwordError) {
      setDirtyFields({ name: true, password: true });
      setFieldErrors({ name: nameError, password: passwordError });
      setLiveMessage(buildValidationSummary([nameError, passwordError]));

      if (nameError) {
        nameInputRef.current?.focus();
      } else {
        passwordInputRef.current?.focus();
      }
      return;
    }

    setPending(true);
    setServerError(null);
    setLiveMessage('');

    try {
      const response = await fetch('/api/users/log-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), password }),
      });

      if (!response.ok) {
        const apiError = await readApiErrorMessage(response);
        const message =
          apiError.error ?? 'No pudimos iniciar sesión con esos datos.';
        setServerError(message);
        setPending(false);
        return;
      }

      router.replace('/');
      router.refresh();
    } catch {
      const message =
        'No se pudo conectar con el servidor. Comprueba tu conexión e inténtalo de nuevo.';
      setServerError(message);
      setPending(false);
    }
  };

  return (
    <LoginForm
      name={name}
      password={password}
      showPassword={showPassword}
      fieldErrors={fieldErrors}
      serverError={serverError}
      liveMessage={liveMessage}
      pending={pending}
      nameInputRef={nameInputRef}
      passwordInputRef={passwordInputRef}
      onNameChange={(e: ChangeEvent<HTMLInputElement>) =>
        handleFieldChange('name', e.target.value)
      }
      onNameBlur={() => handleFieldBlur('name')}
      onPasswordChange={(e: ChangeEvent<HTMLInputElement>) =>
        handleFieldChange('password', e.target.value)
      }
      onPasswordBlur={() => handleFieldBlur('password')}
      onTogglePassword={() => setShowPassword((prev) => !prev)}
      onSubmit={handleSubmit}
    />
  );
}
