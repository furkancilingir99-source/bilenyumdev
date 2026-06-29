import { getAdminStatusKey } from '../lib/auth-config.mjs';
import { readAdminKeyFromFile } from '../lib/auth-users-file.mjs';
import { loadAuthUsers, maskEmail } from '../lib/auth-users.mjs';

/**
 * Kayıtlı kullanıcı sayısını doğrulamak için (şifre göstermez).
 * Tarayıcıda: /api/auth-users-status?key=bilenyum-ekip-2026
 */
export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  const adminKey = process.env.AUTH_ADMIN_KEY || readAdminKeyFromFile() || getAdminStatusKey();
  const key = (req.query && req.query.key) || '';

  if (key !== adminKey) {
    res.statusCode = 401;
    res.end(JSON.stringify({ ok: false, error: 'Geçersiz key.' }));
    return;
  }

  const users = loadAuthUsers();

  res.statusCode = 200;
  res.end(JSON.stringify({
    ok: true,
    source: users.length ? 'config/auth-users.txt veya env' : 'boş',
    userCount: users.length,
    emails: users.map(function (u) { return maskEmail(u.email); }),
    hint: users.length
      ? 'Liste kayıtlı. Giriş: /giris'
      : 'config/auth-users.txt boş — satır ekleyin: email:sifre'
  }));
}
