import 'server-only';
import { z } from 'zod';
import { ValidationError } from '../errors';

export const MAX_BCRYPT_BYTES = 72;

export function uuidSchema(fieldLabel: string) {
  return z
    .string({ error: `${fieldLabel} debe ser un UUID valido.` })
    .trim()
    .pipe(z.uuid({ error: `${fieldLabel} debe ser un UUID valido.` }));
}

export function requiredTextSchema(fieldLabel: string) {
  return z
    .string({ error: `${fieldLabel} es obligatorio.` })
    .trim()
    .min(1, { error: `${fieldLabel} es obligatorio.` });
}

export function positiveIntSchema(fieldLabel: string) {
  return z
    .number({ error: `${fieldLabel} debe ser un numero entero positivo.` })
    .int({ error: `${fieldLabel} debe ser un numero entero positivo.` })
    .positive({ error: `${fieldLabel} debe ser un numero entero positivo.` });
}

export const passwordSchema = z
  .string({ error: 'La contrasena no puede estar vacia.' })
  .min(1, { error: 'La contrasena no puede estar vacia.' })
  .refine((value) => Buffer.byteLength(value, 'utf8') <= MAX_BCRYPT_BYTES, {
    error: `La contrasena no puede superar los ${MAX_BCRYPT_BYTES} bytes.`,
  });

export const bcryptHashSchema = z.string().min(1);

export function updateObjectSchema<T extends z.ZodRawShape>(shape: T) {
  return z
    .object(shape)
    .refine(
      (obj) => Object.values(obj).some((value) => value !== undefined),
      { error: 'No se proporcionaron campos para actualizar.' },
    );
}

/**
 * Valida una entrada con un esquema Zod y lanza `ValidationError` si falla.
 */
export function parseOrThrow<TSchema extends z.ZodType>(
  schema: TSchema,
  input: unknown,
): z.output<TSchema> {
  const result = schema.safeParse(input);
  if (!result.success) {
    const message =
      result.error.issues[0]?.message ?? 'Datos de entrada invalidos.';
    throw new ValidationError(message, { cause: result.error });
  }
  return result.data;
}

