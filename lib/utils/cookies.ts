import type { NextRequest } from 'next/server';

/**
 * Extrae el valor de una cookie desde un objeto `NextRequest` o `Request` estándar.
 */
export function getCookieValue(
  request: NextRequest | Request,
  name: string,
): string | undefined {
  if ('cookies' in request && typeof request.cookies?.get === 'function') {
    return request.cookies.get(name)?.value;
  }

  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) {
    return undefined;
  }

  for (const part of cookieHeader.split(';')) {
    const separatorIndex = part.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const cookieName = part.slice(0, separatorIndex).trim();
    if (cookieName !== name) {
      continue;
    }

    const rawValue = part.slice(separatorIndex + 1).trim();
    try {
      return decodeURIComponent(rawValue);
    } catch {
      return rawValue;
    }
  }

  return undefined;
}

