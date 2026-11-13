import 'server-only';
import { z } from 'zod';
import { parseOrThrow } from './validation';

const databaseUrlSchema = z
  .string({ error: 'Falta la variable de entorno de servidor DATABASE_URL.' })
  .trim()
  .min(1, { error: 'Falta la variable de entorno de servidor DATABASE_URL.' })
  .refine(
    (url) => url.startsWith('postgresql://') || url.startsWith('postgres://'),
    { error: 'DATABASE_URL debe usar el esquema postgresql:// o postgres://.' },
  );

const bcryptSaltRoundsSchema = z.preprocess(
  (raw) => (typeof raw === 'string' && raw.trim() === '' ? undefined : raw),
  z.coerce
    .number({ error: 'BCRYPT_SALT_ROUNDS debe ser un entero entre 4 y 15.' })
    .int({ error: 'BCRYPT_SALT_ROUNDS debe ser un entero entre 4 y 15.' })
    .min(4, { error: 'BCRYPT_SALT_ROUNDS debe ser un entero entre 4 y 15.' })
    .max(15, { error: 'BCRYPT_SALT_ROUNDS debe ser un entero entre 4 y 15.' })
    .default(12),
);

/**
 * Lee y valida con Zod las variables de entorno exclusivas del servidor.
 * Ninguna variable aqui expuesta tiene prefijo NEXT_PUBLIC_, por lo que
 * Next.js nunca las incluye en el bundle del navegador, y `server-only`
 * bloquea en compilacion cualquier import desde Client Components.
 */
class ServerEnvConfig {
  get databaseUrl(): string {
    return parseOrThrow(databaseUrlSchema, process.env.DATABASE_URL);
  }

  get bcryptSaltRounds(): number {
    return parseOrThrow(bcryptSaltRoundsSchema, process.env.BCRYPT_SALT_ROUNDS);
  }
}

export const serverEnv = new ServerEnvConfig();
