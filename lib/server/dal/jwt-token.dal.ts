import 'server-only';
import type { JwtTokenDTO } from '@/lib/interfaces/auth';
import { BaseDAL } from './base.dal';

/**
 * Capa de acceso a datos para la tabla `jwt` (refresh tokens).
 */
export class JwtTokenDAL extends BaseDAL {
  async create(userId: string, token: string): Promise<JwtTokenDTO> {
    return this.execute(() =>
      this.db.jwtToken.create({
        data: {
          userId,
          token,
        },
      }),
    );
  }

  async findActiveByToken(token: string): Promise<JwtTokenDTO | null> {
    return this.execute(() =>
      this.db.jwtToken.findFirst({
        where: {
          token,
          revokedAt: null,
        },
      }),
    );
  }
}

export const jwtTokenDal = new JwtTokenDAL();

