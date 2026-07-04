/** Edge middleware + API — @supabase/supabase-js import etmez */

export const ACCESS_COOKIE = 'bilenyum_access';
export const REFRESH_COOKIE = 'bilenyum_refresh';
export const SESSION_MAX_AGE = 60 * 60;

export function getSupabaseUrl() {
  return String(process.env.SUPABASE_URL || '').trim().replace(/\/+$/, '');
}

export function getSupabaseAnonKey() {
  return String(process.env.SUPABASE_ANON_KEY || '').trim();
}

export function isAuthConfigured() {
  return !!(getSupabaseUrl() && getSupabaseAnonKey());
}

function isProduction() {
  return process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
}

/** @param {string} name @param {string} value @param {number|null|undefined} maxAge */
function cookieLine(name, value, maxAge) {
  const parts = [
    name + '=' + encodeURIComponent(value),
    'Path=/',
    'HttpOnly',
    'SameSite=Lax'
  ];
  if (maxAge != null) parts.push('Max-Age=' + maxAge);
  if (isProduction()) parts.push('Secure');
  return parts.join('; ');
}

export function buildSessionCookies(session) {
  if (!session || !session.access_token) return [];
  return [cookieLine(ACCESS_COOKIE, session.access_token, null)];
}

export function clearSessionCookieHeaders() {
  const secure = isProduction() ? '; Secure' : '';
  return [
    ACCESS_COOKIE + '=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0' + secure,
    REFRESH_COOKIE + '=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0' + secure
  ];
}

/**
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
    const user = await res.json().catch(function () { return null; });
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
