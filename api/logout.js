import { clearSessionCookieHeaders } from '../lib/supabase-session.mjs';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Set-Cookie', clearSessionCookieHeaders());

  if (req.method !== 'POST' && req.method !== 'GET') {
    res.statusCode = 405;
    res.end(JSON.stringify({ ok: false, error: 'Yalnızca POST veya GET desteklenir.' }));
    return;
  }

  res.statusCode = 200;
  res.end(JSON.stringify({ ok: true }));
}
