import 'server-only';
import { type NextRequest, NextResponse } from 'next/server';
import { type ProtectedRouteHandler, requireAuth } from './auth';
import { ServerError, ValidationError } from './errors';

type DefaultRouteContext = {
  params: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * Parsea el cuerpo JSON de una petición o lanza `ValidationError` si es inválido.
 */
export async function parseJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch (error) {
    throw new ValidationError(
      'El cuerpo de la petición debe ser un JSON válido',
      { cause: error },
    );
  }
}

/**
 * Traduce errores de servidor conocidos a su respuesta JSON correspondiente
 * y captura errores inesperados devolviendo 500.
 */
export function handleRouteError(
  error: unknown,
  contextLabel: string,
): NextResponse {
  if (error instanceof ServerError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode },
    );
  }

  console.error(`Error en ${contextLabel}:`, error);
  return NextResponse.json(
    { error: 'Error interno del servidor', code: 'INTERNAL_SERVER_ERROR' },
    { status: 500 },
  );
}

/**
 * Envuelve un Route Handler protegido con `requireAuth` y manejo uniforme de errores.
 */
export function protectedRoute<TContext = DefaultRouteContext>(
  contextLabel: string,
  handler: ProtectedRouteHandler<TContext>,
): (request: NextRequest, context?: TContext) => Promise<Response> {
  const authedHandler = requireAuth<TContext>(handler);

  return async (
    request: NextRequest,
    context?: TContext,
  ): Promise<Response> => {
    try {
      return await authedHandler(request, context);
    } catch (error) {
      return handleRouteError(error, contextLabel);
    }
  };
}

