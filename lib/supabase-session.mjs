import { createClient } from '@supabase/supabase-js';
import { jwtVerify } from 'jose';

export const ACCESS_COOKIE = 'bilenyum_access';
export const REFRESH_COOKIE = 'bilenyum_refresh';

export function getSupabaseUrl() {
  return String(process.env.SUPABASE_URL || '').trim();
}

export function getSupabaseAnonKey() {
  return String(process.env.SUPABASE_ANON_KEY || '').trim();
}

export function getJwtSecret() {
  return String(process.env.SUPABASE_JWT_SECRET || '').trim();
}

export function isAuthConfigured() {
  return !!(getSupabaseUrl() && getSupabaseAnonKey() && getJwtSecret());
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
 * @param {string} token
 * @param {string} jwtSecret
 * @returns {Promise<{ sub: string, email?: string } | null>}
 */
export async function verifyAccessToken(token, jwtSecret) {
  if (!token || !jwtSecret) return null;
  try {
    const secret = new TextEncoder().encode(jwtSecret);
    const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] });
    if (!payload.sub || typeof payload.sub !== 'string') return null;
    if (payload.role && payload.role !== 'authenticated') return null;
    if (payload.banned_until) {
      const bannedUntil = Date.parse(String(payload.banned_until));
      if (!Number.isNaN(bannedUntil) && bannedUntil > Date.now()) return null;
    }
    return {
      sub: payload.sub,
      email: typeof payload.email === 'string' ? payload.email : undefined
    };
  } catch {
    return null;
  }
}
