import 'server-only';
import { z } from 'zod';
import {
  positiveIntSchema,
  requiredTextSchema,
  updateObjectSchema,
  uuidSchema,
} from './common.schema';

const MAX_POSTGRES_INT4 = 2_147_483_647;
const MAX_SUBJECT_INDEX = 999_999_999;

const id = uuidSchema('El id de la asignatura');
const name = requiredTextSchema('El nombre de la asignatura');
const courseId = uuidSchema('El id del curso');
const userId = uuidSchema('El id del usuario');
const hours = positiveIntSchema('La cantidad de horas').max(MAX_POSTGRES_INT4, {
  error: 'La cantidad de horas supera el limite permitido.',
});
const index = z
  .number({ error: 'El indice debe ser un numero valido.' })
  .finite({ error: 'El indice debe ser un numero valido.' })
  .min(1, { error: 'El indice debe ser mayor o igual a 1.' })
  .max(MAX_SUBJECT_INDEX, { error: 'El indice supera el limite permitido.' })
  .refine((value) => Math.abs(value * 10 - Math.round(value * 10)) < 1e-9, {
    error: 'El indice solo puede tener como maximo un decimal.',
  });
const precedingSubjectIds = z
  .array(id, {
    error:
      'La lista de asignaturas previas debe ser un array de UUIDs validos.',
  })
  .refine((ids) => new Set(ids).size === ids.length, {
    error: 'La lista de asignaturas previas no puede contener duplicados.',
  });

export const subjectSchemas = {
  id,
  courseId,
  userId,
  index,
  createBody: z.object({
    name,
    hours,
  }),
  create: z.object({
    name,
    hours,
    courseId,
  }),
  update: updateObjectSchema({
    name: name.optional(),
    hours: hours.optional(),
  }),
  convalidate: z.object({
    userId,
    subjectId: id,
  }),
  setIndexBody: z.object({
    index,
    precedingSubjectIds: precedingSubjectIds.optional(),
  }),
  setIndex: z
    .object({
      userId,
      subjectId: id,
      index,
      precedingSubjectIds: precedingSubjectIds.default([]),
    })
    .refine((data) => !data.precedingSubjectIds.includes(data.subjectId), {
      error:
        'La asignatura objetivo no puede aparecer en la lista de asignaturas previas.',
    }),
} as const;

