'use client';

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { CourseOption } from '@/components/ui/molecules';
import { RegisterForm } from '@/components/ui/organisms';
import {
  buildValidationSummary,
  readApiErrorMessage,
  validateCourseId,
  validatePassword,
  validateUsername,
  type AuthFieldErrorMap,
} from './authValidation';

type RegisterField = 'name' | 'courseId' | 'password';

export interface RegisterContainerProps {
  courses: readonly CourseOption[];
}

export function RegisterContainer({ courses }: RegisterContainerProps) {
  const router = useRouter();
  const nameInputRef = useRef<HTMLInputElement>(null);
  const courseSelectRef = useRef<HTMLSelectElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [courseId, setCourseId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [dirtyFields, setDirtyFields] = useState<Partial<Record<RegisterField, boolean>>>({});
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrorMap<RegisterField>>({});
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

  const handleFieldChange = (field: RegisterField, nextValue: string) => {
    setServerError(null);
    setDirtyFields((prev) => (prev[field] ? prev : { ...prev, [field]: true }));

    if (field === 'name') {
      setName(nextValue);
      if (fieldErrors.name && !validateUsername(nextValue)) {
        setFieldErrors((prev) => ({ ...prev, name: undefined }));
      }
      return;
    }

    if (field === 'courseId') {
      setCourseId(nextValue);
      if (fieldErrors.courseId && !validateCourseId(nextValue)) {
        setFieldErrors((prev) => ({ ...prev, courseId: undefined }));
      }
      return;
    }

    setPassword(nextValue);
    if (fieldErrors.password && !validatePassword(nextValue)) {
      setFieldErrors((prev) => ({ ...prev, password: undefined }));
    }
  };

  const handleFieldBlur = (field: RegisterField) => {
    if (!dirtyFields[field]) {
      return;
    }

    const message =
      field === 'name'
        ? validateUsername(name)
        : field === 'courseId'
          ? validateCourseId(courseId)
          : validatePassword(password);
    setFieldErrors((prev) => ({ ...prev, [field]: message }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending || courses.length === 0) {
      return;
    }

    const nameError = validateUsername(name);
    const courseError = validateCourseId(courseId);
    const passwordError = validatePassword(password);

    if (nameError || courseError || passwordError) {
      setDirtyFields({ name: true, courseId: true, password: true });
      setFieldErrors({
        name: nameError,
        courseId: courseError,
        password: passwordError,
      });
      setLiveMessage(
        buildValidationSummary([nameError, courseError, passwordError]),
      );

      if (nameError) {
        nameInputRef.current?.focus();
      } else if (courseError) {
        courseSelectRef.current?.focus();
      } else {
        passwordInputRef.current?.focus();
      }
      return;
    }

    setPending(true);
    setServerError(null);
    setLiveMessage('');

    const trimmedName = name.trim();

    try {
      const signUpResponse = await fetch('/api/user/sign-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          password,
          courseId,
        }),
      });

      if (!signUpResponse.ok) {
        const apiError = await readApiErrorMessage(signUpResponse);
        if (signUpResponse.status === 409) {
          const duplicateMessage =
            apiError.error ?? 'Este nombre de usuario ya existe.';
          setFieldErrors((prev) => ({ ...prev, name: duplicateMessage }));
          setLiveMessage(duplicateMessage);
          setPending(false);
          nameInputRef.current?.focus();
          return;
        }

        const message =
          apiError.error ?? 'No pudimos completar tu registro. Revisa los datos.';
        setServerError(message);
        setPending(false);
        return;
      }

      const loginResponse = await fetch('/api/users/log-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName, password }),
      });

      if (!loginResponse.ok) {
        const fallbackMessage =
          'Cuenta creada, pero no pudimos abrir la sesión automáticamente. Accede desde Iniciar sesión.';
        setServerError(fallbackMessage);
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
    <RegisterForm
      name={name}
      courseId={courseId}
      password={password}
      showPassword={showPassword}
      courses={courses}
      fieldErrors={fieldErrors}
      serverError={serverError}
      liveMessage={liveMessage}
      pending={pending}
      nameInputRef={nameInputRef}
      courseSelectRef={courseSelectRef}
      passwordInputRef={passwordInputRef}
      onNameChange={(e: ChangeEvent<HTMLInputElement>) =>
        handleFieldChange('name', e.target.value)
      }
      onNameBlur={() => handleFieldBlur('name')}
      onCourseChange={(e: ChangeEvent<HTMLSelectElement>) =>
        handleFieldChange('courseId', e.target.value)
      }
      onCourseBlur={() => handleFieldBlur('courseId')}
      onPasswordChange={(e: ChangeEvent<HTMLInputElement>) =>
        handleFieldChange('password', e.target.value)
      }
      onPasswordBlur={() => handleFieldBlur('password')}
      onTogglePassword={() => setShowPassword((prev) => !prev)}
      onSubmit={handleSubmit}
    />
  );
}
