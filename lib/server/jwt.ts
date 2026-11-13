import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import type { AuthTokenPayload, JwtUserPayload } from '@/lib/interfaces/auth';
import { serverEnv } from './env';

function getSecretKey(): Uint8Array {
  return new TextEncoder().encode(serverEnv.jwtSecret);
}

export async function signAccessToken(payload: JwtUserPayload): Promise<string> {
  return new SignJWT({ name: payload.name, courseId: payload.courseId })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(getSecretKey());
}

export async function signRefreshToken(payload: JwtUserPayload): Promise<string> {
  return new SignJWT({ name: payload.name, courseId: payload.courseId })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime('60d')
    .sign(getSecretKey());
}

export async function verifyAuthToken(token: string): Promise<AuthTokenPayload> {
  const { payload } = await jwtVerify(token, getSecretKey());
  if (
    typeof payload.sub !== 'string' ||
    typeof payload.name !== 'string' ||
    typeof payload.courseId !== 'string'
  ) {
    throw new Error('Token payload inválido');
  }

  return payload as AuthTokenPayload;
}

