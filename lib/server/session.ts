import 'server-only';
import { cookies } from 'next/headers';
import {
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
} from '@/lib/const/auth';
import {
  jwtTokenDal,
  userDal,
  type UserWithCourseDTO,
} from '@/lib/server/dal';
import { verifyAccessToken, verifyAuthToken } from '@/lib/server/jwt';
import { getPrisma } from '@/lib/server/prisma';

async function resolveUserFromAccessToken(
  accessToken: string | undefined,
): Promise<UserWithCourseDTO | null> {
  if (!accessToken) {
    return null;
  }

  try {
    const payload = await verifyAccessToken(accessToken);
    return await userDal.findById(payload.sub);
  } catch {
    return null;
  }
}

async function resolveUserFromRefreshToken(
  refreshToken: string | undefined,
): Promise<UserWithCourseDTO | null> {
  if (!refreshToken) {
    return null;
  }

  try {
    const payload = await verifyAuthToken(refreshToken, 'refresh');
    const activeToken = await jwtTokenDal.findActiveByToken(refreshToken);

    if (!activeToken || activeToken.userId !== payload.sub) {
      return null;
    }

    return await userDal.findById(payload.sub);
  } catch {
    return null;
  }
}

/**
 * Obtiene el usuario autenticado actual desde las cookies HttpOnly de sesion.
 * Debe invocarse dentro de un limite `<Suspense>` cuando `cacheComponents` esta activo.
 */
export async function getSessionUser(): Promise<UserWithCourseDTO | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE_NAME)?.value;
  const userFromAccess = await resolveUserFromAccessToken(accessToken);

  if (userFromAccess) {
    return userFromAccess;
  }

  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE_NAME)?.value;
  return resolveUserFromRefreshToken(refreshToken);
}

/**
 * Revoca un refresh token activo en base de datos durante el cierre de sesion.
 */
export async function revokeRefreshToken(token: string): Promise<void> {
  await getPrisma().jwtToken.updateMany({
    where: {
      token,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
}

