import { loadAuthUsers, maskEmail } from '../lib/auth-users.mjs';

/**
 * Kayıtlı kullanıcı sayısını doğrulamak için (şifre göstermez).
 * Tarayıcıda: /api/auth-users-status?key=AUTH_ADMIN_KEY değeriniz
 */
export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  const adminKey = process.env.AUTH_ADMIN_KEY;
  const key = (req.query && req.query.key) || '';

  if (!adminKey) {
    res.statusCode = 503;
    res.end(JSON.stringify({
      ok: false,
      error: 'AUTH_ADMIN_KEY Vercel\'de tanımlı değil.'
    }));
    return;
  }

  if (key !== adminKey) {
    res.statusCode = 401;
    res.end(JSON.stringify({ ok: false, error: 'Geçersiz key.' }));
    return;
  }

  const users = loadAuthUsers();
  const secretOk = !!(process.env.AUTH_SECRET && process.env.AUTH_SECRET.length >= 16);

  res.statusCode = 200;
  res.end(JSON.stringify({
    ok: true,
    authSecretConfigured: secretOk,
    userCount: users.length,
    emails: users.map(function (u) { return maskEmail(u.email); }),
    hint: users.length
      ? 'Liste kayıtlı. Giriş: /giris'
      : 'AUTH_USERS boş veya okunamıyor — Value formatını kontrol edin.'
  }));
}
