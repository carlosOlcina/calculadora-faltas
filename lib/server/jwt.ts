import 'server-only';
import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { serverEnv } from './env';

export interface JwtUserPayload {
  sub: string;
  name: string;
  courseId: string;
}

export interface AuthTokenPayload extends Omit<JWTPayload, 'sub'>, JwtUserPayload {}

export const ACCESS_TOKEN_MAX_AGE_SECONDS = 60 * 60 * 2; // 2 horas
export const REFRESH_TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 60; // 60 dias

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

