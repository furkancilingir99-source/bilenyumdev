import { safeEqual } from './auth-token.mjs';

/**
 * Kullanıcı listesi — Vercel Environment Variable:
 *
 * AUTH_USERS (tercih edilen, birden fazla kişi):
 * [{"email":"ali@firma.com","password":"Sifre123!"},{"email":"ayse@firma.com","password":"Baska456!"}]
 *
 * Eski tek kullanıcı (geriye dönük):
 * AUTH_USERNAME + AUTH_PASSWORD
 */

/**
 * @returns {{ email: string, password: string }[]}
 */
export function loadAuthUsers() {
  const raw = process.env.AUTH_USERS;
  if (raw && raw.trim()) {
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
