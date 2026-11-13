import 'server-only';
import { z } from 'zod';
import {
  positiveIntSchema,
  requiredTextSchema,
  updateObjectSchema,
  uuidSchema,
} from './common.schema';

const name = requiredTextSchema('El nombre de la asignatura');
const courseId = uuidSchema('El id del curso');
const hours = positiveIntSchema('La cantidad de horas');

export const subjectSchemas = {
  id: uuidSchema('El id de la asignatura'),
  courseId,
  create: z.object({
    name,
    courseId,
    hours,
  }),
  update: updateObjectSchema({
    name: name.optional(),
    courseId: courseId.optional(),
    hours: hours.optional(),
  }),
} as const;

