import { NextRequest, NextResponse } from 'next/server';
import { ServerError, jwtTokenDal } from '@/lib/server/dal';
import {
  ACCESS_TOKEN_MAX_AGE_SECONDS,
  REFRESH_TOKEN_MAX_AGE_SECONDS,
  signAccessToken,
  verifyAuthToken,
} from '@/lib/server/jwt';

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get('refresh_token')?.value;
    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Falta el refresh token', code: 'UNAUTHORIZED' },
        { status: 401 },
      );
    }

    let payload;
    try {
      payload = await verifyAuthToken(refreshToken);
    } catch {
      return NextResponse.json(
        { error: 'Refresh token inválido o expirado', code: 'UNAUTHORIZED' },
        { status: 401 },
      );
    }

    const storedToken = await jwtTokenDal.findActiveByToken(refreshToken);
    if (!storedToken) {
      return NextResponse.json(
        { error: 'Refresh token no registrado o revocado', code: 'UNAUTHORIZED' },
        { status: 401 },
      );
    }

    const expiresAtMs =
      storedToken.createdAt.getTime() + REFRESH_TOKEN_MAX_AGE_SECONDS * 1000;
    if (Date.now() > expiresAtMs) {
      return NextResponse.json(
        { error: 'Refresh token expirado', code: 'UNAUTHORIZED' },
        { status: 401 },
      );
    }

    const accessToken = await signAccessToken({
      sub: payload.sub,
      name: payload.name,
      courseId: payload.courseId,
    });

    const response = NextResponse.json({ ok: true }, { status: 200 });
    response.cookies.set('access_token', accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: ACCESS_TOKEN_MAX_AGE_SECONDS,
    });

    return response;
  } catch (error) {
    if (error instanceof ServerError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode },
      );
    }

    console.error('Error en POST /api/users/refresh:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', code: 'INTERNAL_SERVER_ERROR' },
      { status: 500 },
    );
  }
}

