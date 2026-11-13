import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import type {
  AuthTokenPayload,
  AuthTokenType,
  JwtUserPayload,
} from '@/lib/interfaces/auth';
import { serverEnv } from './env';
import { UnauthorizedError } from './errors';

function getSecretKey(): Uint8Array {
  return new TextEncoder().encode(serverEnv.jwtSecret);
}

async function signToken(
  payload: JwtUserPayload,
  tokenType: AuthTokenType,
  expirationTime: string,
): Promise<string> {
  return new SignJWT({
    name: payload.name,
    courseId: payload.courseId,
    tokenType,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(expirationTime)
    .sign(getSecretKey());
}

export async function signAccessToken(payload: JwtUserPayload): Promise<string> {
  return signToken(payload, 'access', '2h');
}

export async function signRefreshToken(payload: JwtUserPayload): Promise<string> {
  return signToken(payload, 'refresh', '60d');
}

export async function verifyAuthToken(
  token: string,
  expectedType?: AuthTokenType,
): Promise<AuthTokenPayload> {
  const secretKey = getSecretKey();

  try {
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ['HS256'],
    });

    if (
      typeof payload.sub !== 'string' ||
      payload.sub.trim().length === 0 ||
      typeof payload.name !== 'string' ||
      typeof payload.courseId !== 'string'
    ) {
      throw new UnauthorizedError('Token payload inválido');
    }

    if (expectedType !== undefined && payload.tokenType !== expectedType) {
      throw new UnauthorizedError('Tipo de token inválido');
    }

    return payload as AuthTokenPayload;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }

    throw new UnauthorizedError('Token inválido o expirado', { cause: error });
  }
}

export async function verifyAccessToken(
  token: string,
): Promise<AuthTokenPayload> {
  try {
    return await verifyAuthToken(token, 'access');
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw new UnauthorizedError('Access token inválido o expirado', {
        cause: error,
      });
    }

    throw error;
  }
}

