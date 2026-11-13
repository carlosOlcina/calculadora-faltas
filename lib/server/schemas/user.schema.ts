import 'server-only';
import { z } from 'zod';
import {
  bcryptHashSchema,
  passwordSchema,
  requiredTextSchema,
  updateObjectSchema,
  uuidSchema,
} from './common.schema';

const name = requiredTextSchema('El nombre de usuario');
const courseId = uuidSchema('El id del curso');

export const userSchemas = {
  id: uuidSchema('El id del usuario'),
  name,
  courseId,
  password: passwordSchema,
  passwordHash: bcryptHashSchema,
  create: z.object({
    name,
    password: passwordSchema,
    courseId,
  }),
  update: updateObjectSchema({
    name: name.optional(),
    password: passwordSchema.optional(),
    courseId: courseId.optional(),
  }),
} as const;

