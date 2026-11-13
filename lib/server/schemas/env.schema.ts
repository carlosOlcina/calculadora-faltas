import 'server-only';
import { z } from 'zod';

export const envSchemas = {
  databaseUrl: z
    .string({ error: 'Falta la variable de entorno de servidor DATABASE_URL.' })
    .trim()
    .min(1, { error: 'Falta la variable de entorno de servidor DATABASE_URL.' })
    .refine(
      (url) =>
        url.startsWith('postgresql://') || url.startsWith('postgres://'),
      { error: 'DATABASE_URL debe usar el esquema postgresql:// o postgres://.' },
    ),
  bcryptSaltRounds: z.preprocess(
    (raw) => (typeof raw === 'string' && raw.trim() === '' ? undefined : raw),
    z.coerce
      .number({ error: 'BCRYPT_SALT_ROUNDS debe ser un entero entre 4 y 15.' })
      .int({ error: 'BCRYPT_SALT_ROUNDS debe ser un entero entre 4 y 15.' })
      .min(4, { error: 'BCRYPT_SALT_ROUNDS debe ser un entero entre 4 y 15.' })
      .max(15, { error: 'BCRYPT_SALT_ROUNDS debe ser un entero entre 4 y 15.' })
      .default(12),
  ),
  jwtSecret: z
    .string({ error: 'Falta la variable de entorno de servidor JWT_SECRET.' })
    .trim()
    .min(1, { error: 'Falta la variable de entorno de servidor JWT_SECRET.' }),
} as const;

