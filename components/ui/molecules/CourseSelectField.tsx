import type { ChangeEventHandler, FocusEventHandler, Ref } from 'react';
import { FieldMessage, Icon, Label, Select } from '../atoms';

export interface CourseOption {
  id: string;
  name: string;
  totalHours: number;
}

export interface CourseSelectFieldProps {
  id: string;
  name: string;
  label: string;
  value: string;
  courses: readonly CourseOption[];
  onChange: ChangeEventHandler<HTMLSelectElement>;
  onBlur?: FocusEventHandler<HTMLSelectElement>;
  selectRef?: Ref<HTMLSelectElement>;
  disabled?: boolean;
  error?: string;
}

export function CourseSelectField({
  id,
  name,
  label,
  value,
  courses,
  onChange,
  onBlur,
  selectRef,
  disabled = false,
  error,
}: CourseSelectFieldProps) {
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className="cf-field">
      <Label htmlFor={id}>{label}</Label>
      <div className="cf-control-wrap">
        <Select
          ref={selectRef}
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          required
          disabled={disabled || courses.length === 0}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
        >
          <option value="">Selecciona tu curso</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.name} ({course.totalHours} h)
            </option>
          ))}
        </Select>
        <span className="cf-select-chevron" aria-hidden="true">
          <Icon name="chevron-down" />
        </span>
      </div>
      {error && errorId ? (
        <FieldMessage id={errorId} tone="error">
          {error}
        </FieldMessage>
      ) : null}
    </div>
  );
}

