import { safeEqual } from './auth-token.mjs';

/**
 * Vercel Environment Variable: AUTH_USERS
 *
 * Kolay format (önerilen — JSON değil, tırnak hatası olmaz):
 *   furkan@firma.com:Sifre123!,ayse@firma.com:Ayse456!
 *
 * veya her satırda bir kişi (Value alanında Enter ile):
 *   furkan@firma.com:Sifre123!
 *   ayse@firma.com:Ayse456!
 *
 * JSON format (eski):
 *   [{"email":"a@b.com","password":"x"}]
 *
 * Tek kullanıcı (AUTH_USERS yoksa):
 *   AUTH_USERNAME + AUTH_PASSWORD
 */

function parsePair(line) {
  const s = String(line || '').trim();
  if (!s) return null;
  const sep = s.indexOf(':') >= 0 ? ':' : (s.indexOf('|') >= 0 ? '|' : -1);
  if (sep <= 0) return null;
  const email = s.slice(0, sep).trim().toLowerCase();
  const password = s.slice(sep + 1);
  if (!email || !password) return null;
  return { email: email, password: password };
}

function parseSimpleList(raw) {
  const text = String(raw || '').trim();
  if (!text || text.charAt(0) === '[') return null;
  const chunks = text.split(/[\n,;]+/);
  const users = [];
  chunks.forEach(function (chunk) {
    const u = parsePair(chunk);
    if (u) users.push(u);
  });
  return users.length ? users : null;
}

function parseJsonList(raw) {
  try {
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    return list
      .map(function (u) {
        return {
          email: String(u.email || u.username || '').trim().toLowerCase(),
          password: String(u.password || '')
        };
      })
      .filter(function (u) { return u.email && u.password; });
  } catch {
    return [];
  }
}

/**
 * @returns {{ email: string, password: string }[]}
 */
export function loadAuthUsers() {
  const raw = process.env.AUTH_USERS;
  if (raw && raw.trim()) {
    const simple = parseSimpleList(raw);
    if (simple) return simple;
    const json = parseJsonList(raw);
    if (json.length) return json;
    return [];
  }

  const email = String(process.env.AUTH_USERNAME || 'admin').trim().toLowerCase();
  const password = String(process.env.AUTH_PASSWORD || '');
  if (!password) return [];
  return [{ email: email, password: password }];
}

/**
 * @param {string} email
 * @param {string} password
 * @returns {boolean}
 */
export function matchAuthUser(email, password) {
  const normalized = String(email || '').trim().toLowerCase();
  const users = loadAuthUsers();
  if (!users.length || !normalized || !password) return false;

  return users.some(function (u) {
    return safeEqual(u.email, normalized) && safeEqual(u.password, password);
  });
}

/**
 * @param {string} email
 * @returns {string}
 */
export function displayEmail(email) {
  return String(email || '').trim().toLowerCase();
}

/** @param {string} email */
export function maskEmail(email) {
  const e = String(email || '');
  const at = e.indexOf('@');
  if (at <= 1) return '***';
  return e.charAt(0) + '***' + e.slice(at);
}
