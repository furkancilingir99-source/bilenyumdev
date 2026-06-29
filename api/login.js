import { getAuthSecret } from '../lib/auth-config.mjs';
import {
  cookieHeader,
  createSessionToken,
  SESSION_MAX_AGE
} from '../lib/auth-token.mjs';
import { displayEmail, loadAuthUsers, matchAuthUser } from '../lib/auth-users.mjs';

function readBody(req) {
  return new Promise(function (resolve, reject) {
    var chunks = [];
    req.on('data', function (c) { chunks.push(c); });
    req.on('end', function () {
      try {
        var raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.end(JSON.stringify({ ok: false, error: 'Yalnızca POST desteklenir.' }));
    return;
  }

  const secret = getAuthSecret();
  if (!loadAuthUsers().length) {
    res.statusCode = 503;
    res.end(JSON.stringify({ ok: false, error: 'Kullanıcı listesi boş. config/auth-users.txt dosyasını kontrol edin.' }));
    return;
  }

  let body;
  try {
    body = await readBody(req);
  } catch {
    res.statusCode = 400;
    res.end(JSON.stringify({ ok: false, error: 'Geçersiz istek gövdesi.' }));
    return;
  }

  const email = displayEmail(body.username || body.email || '');
  const password = String(body.password || '');

  if (!matchAuthUser(email, password)) {
    res.statusCode = 401;
    res.end(JSON.stringify({ ok: false, error: 'Kullanıcı adı veya şifre hatalı.' }));
    return;
  }

  const token = await createSessionToken(secret, email, SESSION_MAX_AGE);
  res.setHeader('Set-Cookie', cookieHeader(token, SESSION_MAX_AGE));
  res.statusCode = 200;
  res.end(JSON.stringify({ ok: true, username: email }));
}
