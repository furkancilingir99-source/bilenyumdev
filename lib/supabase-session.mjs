import { createClient } from '@supabase/supabase-js';

export const ACCESS_COOKIE = 'bilenyum_access';
export const REFRESH_COOKIE = 'bilenyum_refresh';

export function getSupabaseUrl() {
  return String(process.env.SUPABASE_URL || '').trim().replace(/\/+$/, '');
}

export function getSupabaseAnonKey() {
  return String(process.env.SUPABASE_ANON_KEY || '').trim();
}

export function isAuthConfigured() {
  return !!(getSupabaseUrl() && getSupabaseAnonKey());
}

/** @returns {import('@supabase/supabase-js').SupabaseClient | null} */
export function createSupabaseClient() {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

function isProduction() {
  return process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
}

/** @param {string} name @param {string} value @param {number} maxAge */
function cookieLine(name, value, maxAge) {
  const parts = [
    name + '=' + encodeURIComponent(value),
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=' + maxAge
  ];
  if (isProduction()) parts.push('Secure');
  return parts.join('; ');
}

/** @param {{ access_token: string, refresh_token: string, expires_in?: number } | null} session */
export function buildSessionCookies(session) {
  if (!session || !session.access_token || !session.refresh_token) return [];
  const accessMax = Math.max(60, Number(session.expires_in) || 3600);
  const refreshMax = 60 * 60 * 24 * 30;
  return [
    cookieLine(ACCESS_COOKIE, session.access_token, accessMax),
    cookieLine(REFRESH_COOKIE, session.refresh_token, refreshMax)
  ];
}

export function clearSessionCookieHeaders() {
  const secure = isProduction() ? '; Secure' : '';
  return [
    ACCESS_COOKIE + '=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0' + secure,
    REFRESH_COOKIE + '=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0' + secure
  ];
}

/**
 * Supabase API ile oturum doğrulama (Edge + Node).
 * @param {string} accessToken
 * @returns {Promise<{ sub: string, email?: string } | null>}
 */
export async function verifyAccessToken(accessToken) {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  if (!url || !key || !accessToken) return null;

  try {
    const res = await fetch(url + '/auth/v1/user', {
      headers: {
        Authorization: 'Bearer ' + accessToken,
        apikey: key
      }
    });
    if (!res.ok) return null;
    const user = await res.json();
    if (!user || !user.id) return null;
    if (user.banned_until) {
      const bannedUntil = Date.parse(String(user.banned_until));
      if (!Number.isNaN(bannedUntil) && bannedUntil > Date.now()) return null;
    }
    return {
      sub: user.id,
      email: typeof user.email === 'string' ? user.email : undefined
    };
  } catch {
    return null;
  }
}

/**
 * @param {string} refreshToken
 * @returns {Promise<{ access_token: string, refresh_token: string, expires_in?: number, user?: { id: string, email?: string } } | null>}
 */
export async function refreshSession(refreshToken) {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  if (!url || !key || !refreshToken) return null;

  try {
    const res = await fetch(url + '/auth/v1/token?grant_type=refresh_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: key
      },
      body: JSON.stringify({ refresh_token: refreshToken })
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.access_token || !data.refresh_token) return null;
    return data;
  } catch {
    return null;
  }
}
