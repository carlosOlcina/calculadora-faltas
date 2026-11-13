import 'server-only';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { serverEnv } from './env';
import { parseOrThrow, passwordSchema } from './validation';

const bcryptHashSchema = z.string().min(1);

/**
 * Servicio encapsulado para calcular y verificar hashes de contrasenas con bcrypt.
 */
export class PasswordHasher {
  private readonly explicitSaltRounds?: number;

  constructor(saltRounds?: number) {
    this.explicitSaltRounds = saltRounds;
  }

  /**
   * Genera el hash bcrypt de una contrasena en texto plano.
   * Valida con Zod que no este vacia ni supere el limite de 72 bytes UTF-8 de bcrypt.
   */
  async hash(plainPassword: string): Promise<string> {
    const validatedPassword = parseOrThrow(passwordSchema, plainPassword);
    const saltRounds = this.explicitSaltRounds ?? serverEnv.bcryptSaltRounds;
    return bcrypt.hash(validatedPassword, saltRounds);
  }

  /**
   * Verifica una contrasena en texto plano contra un hash bcrypt almacenado.
   */
  async verify(plainPassword: string, passwordHash: string): Promise<boolean> {
    if (
      !passwordSchema.safeParse(plainPassword).success ||
      !bcryptHashSchema.safeParse(passwordHash).success
    ) {
      return false;
    }

    return bcrypt.compare(plainPassword, passwordHash);
  }
}

export const passwordHasher = new PasswordHasher();
