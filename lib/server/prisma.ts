import 'server-only';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma/client';
import { serverEnv } from './env';

const globalForPrisma = globalThis as typeof globalThis & {
  __calculadoraFaltasPrisma?: PrismaClient;
};

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg({
    connectionString: serverEnv.databaseUrl,
  });

  return new PrismaClient({ adapter });
}

/**
 * Devuelve la instancia singleton de PrismaClient en el servidor.
 * En desarrollo se reutiliza via globalThis para no agotar el pool en HMR.
 */
export function getPrisma(): PrismaClient {
  if (!globalForPrisma.__calculadoraFaltasPrisma) {
    globalForPrisma.__calculadoraFaltasPrisma = createPrismaClient();
  }

  return globalForPrisma.__calculadoraFaltasPrisma;
}

