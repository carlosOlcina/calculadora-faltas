import 'server-only';
import { z } from 'zod';
import {
  positiveIntSchema,
  updateObjectSchema,
  uuidSchema,
} from './common.schema';

const userId = uuidSchema('El id del usuario');
const subjectId = uuidSchema('El id de la asignatura');
const hoursMissed = positiveIntSchema('Las horas faltadas');
const justified = z.boolean({
  error: 'El campo justificada debe ser un booleano.',
});

export const absenceSchemas = {
  id: uuidSchema('El id de la falta'),
  userId,
  subjectId,
  createBody: z.object({
    subjectId,
    hoursMissed,
    justified: justified.optional(),
  }),
  create: z.object({
    userId,
    subjectId,
    hoursMissed,
    justified: justified.default(false),
  }),
  update: updateObjectSchema({
    subjectId: subjectId.optional(),
    hoursMissed: hoursMissed.optional(),
    justified: justified.optional(),
  }),
} as const;

