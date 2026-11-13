import 'server-only';
import type { z } from 'zod';
import { Prisma, type PrismaClient } from '@/generated/prisma/client';
import {
  ForeignKeyConstraintError,
  NotFoundError,
  UniqueConstraintError,
} from '../errors';
import { getPrisma } from '../prisma';
import { parseOrThrow } from '../schemas';

function extractUniqueTarget(meta: unknown): string[] | undefined {
  if (!meta || typeof meta !== 'object') {
    return undefined;
  }

  const record = meta as Record<string, unknown>;
  if (Array.isArray(record.target)) {
    return record.target.filter((item): item is string => typeof item === 'string');
  }

  const adapterError = record.driverAdapterError as
    | { cause?: { constraint?: { fields?: unknown } } }
    | undefined;
  const fields = adapterError?.cause?.constraint?.fields;
  if (Array.isArray(fields)) {
    return fields.filter((item): item is string => typeof item === 'string');
  }

  return undefined;
}

/**
 * Clase base para la capa de acceso a datos (DAL).
 * Centraliza la conexion singleton, validacion con Zod y traduccion de errores Prisma.
 */
export abstract class BaseDAL {
  private readonly customDb?: PrismaClient;

  constructor(db?: PrismaClient) {
    this.customDb = db;
  }

  protected get db(): PrismaClient {
    return this.customDb ?? getPrisma();
  }

  protected validate<TSchema extends z.ZodType>(
    schema: TSchema,
    input: unknown,
  ): z.output<TSchema> {
    return parseOrThrow(schema, input);
  }

  protected async execute<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const target = extractUniqueTarget(error.meta);
          throw new UniqueConstraintError(
            'Ya existe un registro con el mismo valor unico.',
            target,
            { cause: error },
          );
        }

        if (error.code === 'P2003') {
          throw new ForeignKeyConstraintError(
            'Referencia invalida o el registro tiene elementos asociados.',
            { cause: error },
          );
        }

        if (error.code === 'P2025') {
          throw new NotFoundError('No se encontro el registro solicitado.', {
            cause: error,
          });
        }
      }

      throw error;
    }
  }
}
