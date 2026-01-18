
// import type { JWTPayload } from 'hono/utils/jwt/types';
// export interface SupabaseJWTPayload extends JWTPayload {
//   iss: string; // Issuer
//   aud: string | string[]; // Audience
//   exp: number; // Expiration Time
//   iat: number; // Issued At
//   sub: string; // Subject (user ID)
//   role: string; // User role
//   aal: string; // Authenticator Assurance Level
//   session_id: string; // Session ID
//   email: string; // User's email
//   phone: string; // User's phone number
//   is_anonymous: boolean; // Anonymous flag
// }

import { factory } from '../lib/factory';
import { jwt } from 'hono/jwt';

export const verifyToken = factory.createMiddleware(async (c, next) => {
  const jwtMiddleware = jwt({
    secret: c.env.SUPABASE_JWT_SECRET,
    alg: 'HS256',
  });
  return jwtMiddleware(c, next);
});