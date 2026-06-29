import { safeEqual } from './auth-token.mjs';
import { readUsersFromFile } from './auth-users-file.mjs';
import bundledUsers from '../config/auth-users.mjs';

/**
 * Öncelik sırası:
 * 1) config/auth-users.txt (repo — Vercel ayarı gerekmez)
 * 2) AUTH_USERS env (kolay veya JSON format)
 * 3) AUTH_USERNAME + AUTH_PASSWORD
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

function loadFromEnv() {
  const raw = process.env.AUTH_USERS;
  if (raw && raw.trim()) {
    const simple = parseSimpleList(raw);
    if (simple) return simple;
    const json = parseJsonList(raw);
    if (json.length) return json;
    return [];
  }

  const email = String(process.env.AUTH_USERNAME || '').trim().toLowerCase();
  const password = String(process.env.AUTH_PASSWORD || '');
  if (email && password) return [{ email: email, password: password }];
  return [];
}

/**
 * @returns {{ email: string, password: string }[]}
 */
export function loadAuthUsers() {
  const fileUsers = readUsersFromFile();
  if (fileUsers.length) return fileUsers;
  if (Array.isArray(bundledUsers) && bundledUsers.length) return bundledUsers;
  return loadFromEnv();
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
