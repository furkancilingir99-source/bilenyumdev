import { createClient } from '@supabase/supabase-js';
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  SESSION_MAX_AGE,
  buildSessionCookies,
  clearSessionCookieHeaders,
  getSupabaseAnonKey,
  getSupabaseUrl,
  isAuthConfigured,
  verifyAccessToken
} from './supabase-auth-common.mjs';

export {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  SESSION_MAX_AGE,
  buildSessionCookies,
  clearSessionCookieHeaders,
  getSupabaseAnonKey,
  getSupabaseUrl,
  isAuthConfigured,
  verifyAccessToken
};

/** @returns {import('@supabase/supabase-js').SupabaseClient | null} */
export function createSupabaseClient() {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}
