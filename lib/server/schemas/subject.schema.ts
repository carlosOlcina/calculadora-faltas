import 'server-only';
import { z } from 'zod';
import {
  positiveIntSchema,
  requiredTextSchema,
  updateObjectSchema,
  uuidSchema,
} from './common.schema';

const MAX_POSTGRES_INT4 = 2_147_483_647;

const name = requiredTextSchema('El nombre de la asignatura');
const courseId = uuidSchema('El id del curso');
const userId = uuidSchema('El id del usuario');
const hours = positiveIntSchema('La cantidad de horas').max(MAX_POSTGRES_INT4, {
  error: 'La cantidad de horas supera el limite permitido.',
});

export const subjectSchemas = {
  id: uuidSchema('El id de la asignatura'),
  courseId,
  userId,
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
} as const;

