import jwt from 'jsonwebtoken';
import { config } from '../config/env';

export interface TokenPayload {
  sub: string;
  username: string;
  role: string;
  fullName: string;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  } as jwt.SignOptions);
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, config.jwtSecret) as TokenPayload;
}
