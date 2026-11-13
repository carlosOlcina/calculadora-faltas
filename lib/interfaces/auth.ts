import type { JWTPayload } from 'jose';

export interface JwtUserPayload {
  sub: string;
  name: string;
  courseId: string;
}

export interface AuthTokenPayload
  extends Omit<JWTPayload, 'sub'>,
    JwtUserPayload {}

export interface JwtTokenDTO {
  id: string;
  userId: string;
  token: string;
  createdAt: Date;
  revokedAt: Date | null;
}

