import jwt from 'jsonwebtoken';
import { UserPayload } from '../types/express';

const JWT_SECRET = process.env.JWT_SECRET || 'ordinis_ai_default_secret_key_change_me_in_production';

if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'ordinis_ai_default_secret_key_change_me_in_production')) {
  console.error('[security]: JWT_SECRET is not configured for production! System is insecure.');
}

/**
 * Sign a new JWT token containing user details
 */
export const signToken = (payload: UserPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d', // Session valid for 7 days
  });
};

/**
 * Verify a JWT token and decode its payload
 */
export const verifyToken = (token: string): UserPayload => {
  return jwt.verify(token, JWT_SECRET) as UserPayload;
};
