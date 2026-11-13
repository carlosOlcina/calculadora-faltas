import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
} from '@/lib/const/auth';
import { handleRouteError } from '@/lib/server/route-helpers';
import { revokeRefreshToken } from '@/lib/server/session';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE_NAME)?.value;

    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }

    const isProduction = process.env.NODE_ENV === 'production';
    const response = NextResponse.json({ ok: true });

    const clearCookieOptions = {
      httpOnly: true,
      sameSite: 'lax' as const,
      path: '/',
      secure: isProduction,
      maxAge: 0,
    };

    response.cookies.set(ACCESS_TOKEN_COOKIE_NAME, '', clearCookieOptions);
    response.cookies.set(REFRESH_TOKEN_COOKIE_NAME, '', clearCookieOptions);

    return response;
  } catch (error) {
    return handleRouteError(error, 'POST /api/users/log-out');
  }
}
