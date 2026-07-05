import { readCookie } from '../lib/auth-public.mjs';
import {
  ACCESS_COOKIE,
  isAuthConfigured,
  verifyAccessToken
} from '../lib/supabase-auth-common.mjs';
import {
  buildSessionCookies,
  clearSessionCookieHeaders,
  createSupabaseClient
} from '../lib/supabase-session.mjs';
import { handleTrialManagerRoute } from './lib/trial-manager-routes.mjs';

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

function routeSegments(req) {
  var path = req.query.path;
  if (Array.isArray(path)) return path;
  if (typeof path === 'string' && path) return [path];
  return [];
}

async function handleLogin(req, res) {
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

  var body;
  try {
    body = await readBody(req);
  } catch {
    res.statusCode = 400;
    res.end(JSON.stringify({ ok: false, error: 'Geçersiz istek gövdesi.' }));
    return;
  }

  var email = String(body.username || body.email || '').trim().toLowerCase();
  var password = String(body.password || '');

  if (!email || !password) {
    res.statusCode = 400;
    res.end(JSON.stringify({ ok: false, error: 'E-posta ve şifre gerekli.' }));
    return;
  }

  var supabase = createSupabaseClient();
  if (!supabase) {
    res.statusCode = 503;
    res.end(JSON.stringify({ ok: false, error: 'Supabase istemcisi oluşturulamadı.' }));
    return;
  }

  var result = await supabase.auth.signInWithPassword({ email: email, password: password });
  var data = result.data;
  var error = result.error;

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

function handleLogout(req, res) {
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

async function handleSessionCheck(req, res) {
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

  var accessToken = readCookie(req, ACCESS_COOKIE);
  var session = accessToken ? await verifyAccessToken(accessToken) : null;

  res.statusCode = 200;
  res.end(JSON.stringify({ authenticated: !!session }));
}

export default async function handler(req, res) {
  var segments = routeSegments(req);
  var head = segments[0] || '';

  if (head === 'login') {
    await handleLogin(req, res);
    return;
  }

  if (head === 'logout') {
    handleLogout(req, res);
    return;
  }

  if (head === 'session-check') {
    await handleSessionCheck(req, res);
    return;
  }

  if (head === 'trial-manager') {
    handleTrialManagerRoute(res, req, segments[1] || '');
    return;
  }

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.statusCode = 404;
  res.end(JSON.stringify({ ok: false, error: 'Bilinmeyen API uç noktası.' }));
}
