import 'server-only';
import { z } from 'zod';
import {
  positiveIntSchema,
  requiredTextSchema,
  updateObjectSchema,
  uuidSchema,
} from './common.schema';

const name = requiredTextSchema('El nombre del curso');
const totalHours = positiveIntSchema('La duracion total en horas');

export const courseSchemas = {
  id: uuidSchema('El id del curso'),
  name,
  create: z.object({
    name,
    totalHours,
  }),
  update: updateObjectSchema({
    name: name.optional(),
    totalHours: totalHours.optional(),
  }),
} as const;

