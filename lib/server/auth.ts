import 'server-only';
import { type NextRequest, NextResponse } from 'next/server';
import { ACCESS_TOKEN_COOKIE_NAME } from '@/lib/const/auth';
import { getCookieValue } from '@/lib/utils/cookies';
import { ServerError, UnauthorizedError } from './errors';
import { verifyAccessToken } from './jwt';

type DefaultRouteContext = {
  params: Promise<Record<string, string | string[] | undefined>>;
};

export type ProtectedRouteHandler<TContext = DefaultRouteContext> = (
  request: NextRequest,
  userId: string,
  context: TContext,
) => Promise<Response> | Response;

/**
 * Envuelve un Route Handler exigiendo un `access_token` válido en cookies
 * e inyecta el `userId` autenticado al handler protegido.
 */
export function requireAuth<TContext = DefaultRouteContext>(
  handler: ProtectedRouteHandler<TContext>,
): (request: NextRequest, context?: TContext) => Promise<Response> {
  return async (
    request: NextRequest,
    context?: TContext,
  ): Promise<Response> => {
    try {
      const accessToken = getCookieValue(request, ACCESS_TOKEN_COOKIE_NAME);
      if (!accessToken) {
        throw new UnauthorizedError('Falta el access token');
      }

      const payload = await verifyAccessToken(accessToken);
      return await handler(request, payload.sub, context as TContext);
    } catch (error) {
      if (error instanceof ServerError) {
        return NextResponse.json(
          { error: error.message, code: error.code },
          { status: error.statusCode },
        );
      }

      throw error;
    }
  };
}
