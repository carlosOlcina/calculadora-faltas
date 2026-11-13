import 'server-only';
import { envSchemas, parseOrThrow } from './schemas';

/**
 * Lee y valida con Zod las variables de entorno exclusivas del servidor.
 * Ninguna variable aqui expuesta tiene prefijo NEXT_PUBLIC_, por lo que
 * Next.js nunca las incluye en el bundle del navegador, y `server-only`
 * bloquea en compilacion cualquier import desde Client Components.
 */
class ServerEnvConfig {
  get databaseUrl(): string {
    return parseOrThrow(envSchemas.databaseUrl, process.env.DATABASE_URL);
  }

  get bcryptSaltRounds(): number {
    return parseOrThrow(
      envSchemas.bcryptSaltRounds,
      process.env.BCRYPT_SALT_ROUNDS,
    );
  }
}

export const serverEnv = new ServerEnvConfig();
