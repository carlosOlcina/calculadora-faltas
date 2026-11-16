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
  CourseSelectField,
  FormField,
  PasswordField,
  type CourseOption,
} from '../molecules';

export interface RegisterFormProps {
  name: string;
  courseId: string;
  password: string;
  showPassword: boolean;
  courses: readonly CourseOption[];
  fieldErrors: {
    name?: string;
    courseId?: string;
    password?: string;
  };
  serverError: string | null;
  liveMessage: string;
  pending: boolean;
  nameInputRef?: Ref<HTMLInputElement>;
  courseSelectRef?: Ref<HTMLSelectElement>;
  passwordInputRef?: Ref<HTMLInputElement>;
  onNameChange: ChangeEventHandler<HTMLInputElement>;
  onNameBlur: FocusEventHandler<HTMLInputElement>;
  onCourseChange: ChangeEventHandler<HTMLSelectElement>;
  onCourseBlur: FocusEventHandler<HTMLSelectElement>;
  onPasswordChange: ChangeEventHandler<HTMLInputElement>;
  onPasswordBlur: FocusEventHandler<HTMLInputElement>;
  onTogglePassword: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
}

export function RegisterForm({
  name,
  courseId,
  password,
  showPassword,
  courses,
  fieldErrors,
  serverError,
  liveMessage,
  pending,
  nameInputRef,
  courseSelectRef,
  passwordInputRef,
  onNameChange,
  onNameBlur,
  onCourseChange,
  onCourseBlur,
  onPasswordChange,
  onPasswordBlur,
  onTogglePassword,
  onSubmit,
}: RegisterFormProps) {
  const catalogEmpty = courses.length === 0;
  const bannerMessage = catalogEmpty
    ? 'No hay cursos disponibles en el catálogo en este momento.'
    : serverError;

  return (
    <>
      <AuthFormHeader title="Crear cuenta" />

      {bannerMessage ? <StatusBanner tone="error">{bannerMessage}</StatusBanner> : null}

      <form className="cf-form" onSubmit={onSubmit} noValidate>
        <FormField
          id="register-username"
          name="username"
          label="Nombre de usuario"
          value={name}
          onChange={onNameChange}
          onBlur={onNameBlur}
          inputRef={nameInputRef}
          autoComplete="username"
          placeholder="ej. lucia.martinez"
          enterKeyHint="next"
          disabled={pending || catalogEmpty}
          error={fieldErrors.name}
        />

        <CourseSelectField
          id="register-course"
          name="courseId"
          label="Curso matriculado"
          value={courseId}
          courses={courses}
          onChange={onCourseChange}
          onBlur={onCourseBlur}
          selectRef={courseSelectRef}
          disabled={pending || catalogEmpty}
          error={fieldErrors.courseId}
        />

        <PasswordField
          id="register-password"
          name="password"
          label="Contraseña"
          value={password}
          visible={showPassword}
          onChange={onPasswordChange}
          onBlur={onPasswordBlur}
          onToggleVisible={onTogglePassword}
          inputRef={passwordInputRef}
          autoComplete="new-password"
          placeholder="Crea una contraseña"
          enterKeyHint="done"
          disabled={pending || catalogEmpty}
          error={fieldErrors.password}
        />

        <Button type="submit" variant="primary" disabled={pending || catalogEmpty}>
          {pending ? <Icon name="spinner" /> : null}
          {pending ? 'Creando cuenta…' : 'Crear cuenta'}
        </Button>

        <LiveAnnouncer message={liveMessage} />
      </form>

      <AuthFormFooter
        prompt="¿Ya tienes cuenta?"
        linkLabel="Iniciar sesión"
        href="/login"
      />
    </>
  );
}

