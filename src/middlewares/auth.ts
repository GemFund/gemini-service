import { factory } from '../lib/factory';
import { jwt } from 'hono/jwt';
import { getEnv } from '../lib/env';

export const verifyToken = factory.createMiddleware(async (c, next) => {
  const jwtMiddleware = jwt({
    secret: getEnv().SUPABASE_JWT_SECRET,
    alg: 'HS256',
  });
  return jwtMiddleware(c, next);
});
