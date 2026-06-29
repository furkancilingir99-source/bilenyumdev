/** @typedef {{ u: string, exp: number }} SessionPayload */

export const COOKIE_NAME = 'bilenyum_session';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 gün

function b64urlEncode(str) {
  const b64 = typeof Buffer !== 'undefined'
    ? Buffer.from(str, 'utf8').toString('base64')
    : btoa(unescape(encodeURIComponent(str)));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function b64urlDecode(str) {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4));
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(b64 + pad, 'base64').toString('utf8');
  }
  return decodeURIComponent(escape(atob(b64 + pad)));
}

async function hmacSign(secret, data) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  const bytes = new Uint8Array(sig);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return b64urlEncode(bin);
}

/**
 * @param {string} secret
 * @param {string} username
 * @param {number} [maxAgeSec]
 */
export async function createSessionToken(secret, username, maxAgeSec = SESSION_MAX_AGE) {
  /** @type {SessionPayload} */
  const payload = { u: username, exp: Math.floor(Date.now() / 1000) + maxAgeSec };
  const payloadB64 = b64urlEncode(JSON.stringify(payload));
  const sig = await hmacSign(secret, payloadB64);
  return payloadB64 + '.' + sig;
}

/**
 * @param {string} secret
 * @param {string} token
 * @returns {Promise<SessionPayload | null>}
 */
export async function verifySessionToken(secret, token) {
  if (!secret || !token) return null;
  const dot = token.indexOf('.');
  if (dot <= 0) return null;
  const payloadB64 = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = await hmacSign(secret, payloadB64);
  if (sig.length !== expected.length) return null;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  if (diff !== 0) return null;
  try {
    /** @type {SessionPayload} */
    const data = JSON.parse(b64urlDecode(payloadB64));
    if (!data || typeof data.u !== 'string' || typeof data.exp !== 'number') return null;
    if (data.exp < Math.floor(Date.now() / 1000)) return null;
    return data;
  } catch {
    return null;
  }
}

export function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function cookieHeader(token, maxAgeSec = SESSION_MAX_AGE) {
  const secure = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
  const parts = [
    COOKIE_NAME + '=' + token,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=' + maxAgeSec
  ];
  if (secure) parts.push('Secure');
  return parts.join('; ');
}

export function clearCookieHeader() {
  const secure = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
  const parts = [COOKIE_NAME + '=', 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0'];
  if (secure) parts.push('Secure');
  return parts.join('; ');
}

export function isPublicPath(pathname) {
  if (!pathname || pathname === '/giris' || pathname === '/giris.html') return true;
  if (pathname === '/login' || pathname === '/login.html') return true;
  if (pathname === '/sifremi-unuttum' || pathname === '/sifremi-unuttum.html') return true;
  if (pathname.startsWith('/api/login') || pathname.startsWith('/api/logout')) return true;
  if (pathname.startsWith('/api/auth-users-status')) return true;
  if (pathname.startsWith('/assets/')) return true;
  if (pathname === '/favicon.ico') return true;
  if (/\.(css|js|svg|png|jpg|jpeg|gif|webp|woff2?|ico|map)$/i.test(pathname)) return true;
  return false;
}

export function readCookie(request, name) {
  if (request.cookies && typeof request.cookies.get === 'function') {
    const c = request.cookies.get(name);
    if (c && c.value) return c.value;
  }
  const header = request.headers.get('cookie') || '';
  const re = new RegExp('(?:^|;\\s*)' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)');
  const m = header.match(re);
  return m ? decodeURIComponent(m[1]) : '';
}
