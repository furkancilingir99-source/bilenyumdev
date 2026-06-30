import {
  buildSessionCookies,
  createSupabaseClient,
  isAuthConfigured
} from '../lib/supabase-session.mjs';

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

  if (!isAuthConfigured()) {
    res.statusCode = 503;
    res.end(JSON.stringify({
      ok: false,
      error: 'Supabase yapılandırılmamış. config/SUPABASE-KURULUM.txt dosyasına bakın.'
    }));
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

  const email = String(body.username || body.email || '').trim().toLowerCase();
  const password = String(body.password || '');

  if (!email || !password) {
    res.statusCode = 400;
    res.end(JSON.stringify({ ok: false, error: 'E-posta ve şifre gerekli.' }));
    return;
  }

  const supabase = createSupabaseClient();
  if (!supabase) {
    res.statusCode = 503;
    res.end(JSON.stringify({ ok: false, error: 'Supabase istemcisi oluşturulamadı.' }));
    return;
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email: email, password: password });

  if (error || !data.session) {
    var msg = 'Kullanıcı adı veya şifre hatalı.';
    if (error && error.message && /confirm/i.test(error.message)) {
      msg = 'E-posta onaylanmamış. Supabase panelinde kullanıcıyı Auto Confirm ile oluşturun.';
    }
    res.statusCode = 401;
    res.end(JSON.stringify({ ok: false, error: msg }));
    return;
  }

  res.setHeader('Set-Cookie', buildSessionCookies(data.session));
  res.statusCode = 200;
  res.end(JSON.stringify({ ok: true, email: data.user?.email || email }));
}
