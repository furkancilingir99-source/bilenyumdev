import { readCookie } from '../lib/auth-public.mjs';
import {
  ACCESS_COOKIE,
  isAuthConfigured,
  verifyAccessToken
} from '../lib/supabase-session.mjs';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.end(JSON.stringify({ authenticated: false, error: 'Yalnızca GET desteklenir.' }));
    return;
  }

  if (!isAuthConfigured()) {
    res.statusCode = 503;
    res.end(JSON.stringify({ authenticated: false }));
    return;
  }

  const accessToken = readCookie(req, ACCESS_COOKIE);
  const session = accessToken ? await verifyAccessToken(accessToken) : null;

  res.statusCode = 200;
  res.end(JSON.stringify({ authenticated: !!session }));
}
