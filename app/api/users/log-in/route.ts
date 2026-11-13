import { NextResponse } from 'next/server';
import {
  ServerError,
  jwtTokenDal,
  passwordHasher,
  userDal,
} from '@/lib/server/dal';
import {
  ACCESS_TOKEN_MAX_AGE_SECONDS,
  REFRESH_TOKEN_MAX_AGE_SECONDS,
} from '@/lib/const/auth';
import {
  signAccessToken,
  signRefreshToken,
} from '@/lib/server/jwt';
import { parseOrThrow, userSchemas } from '@/lib/server/schemas';

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error: 'El cuerpo de la petición debe ser un JSON válido',
          code: 'VALIDATION_ERROR',
        },
        { status: 400 },
      );
    }

    const input = parseOrThrow(userSchemas.login, body);

    const user = await userDal.findAuthByName(input.name);
    if (!user) {
      return NextResponse.json(
        { error: 'El usuario no existe', code: 'NOT_FOUND' },
        { status: 404 },
      );
    }

    const isPasswordValid = await passwordHasher.verify(
      input.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'La contraseña no es correcta', code: 'UNAUTHORIZED' },
        { status: 401 },
      );
    }

    const tokenPayload = {
      sub: user.id,
      name: user.name,
      courseId: user.courseId,
    };

    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken(tokenPayload),
      signRefreshToken(tokenPayload),
    ]);

    await jwtTokenDal.create(user.id, refreshToken);

    const isProduction = process.env.NODE_ENV === 'production';
    const response = NextResponse.json({ refreshToken }, { status: 200 });

    response.cookies.set('access_token', accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: isProduction,
      maxAge: ACCESS_TOKEN_MAX_AGE_SECONDS,
    });

    response.cookies.set('refresh_token', refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: isProduction,
      maxAge: REFRESH_TOKEN_MAX_AGE_SECONDS,
    });

    return response;
  } catch (error) {
    if (error instanceof ServerError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode },
      );
    }

    console.error('Error en POST /api/users/log-in:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', code: 'INTERNAL_SERVER_ERROR' },
      { status: 500 },
    );
  }
}

