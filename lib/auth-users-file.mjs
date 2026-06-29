import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function resolveConfigFile(name) {
  const candidates = [
    path.join(process.cwd(), 'config', name),
    path.join(__dirname, '..', 'config', name),
    path.join('/var/task', 'config', name)
  ];
  for (let i = 0; i < candidates.length; i++) {
    if (fs.existsSync(candidates[i])) return candidates[i];
  }
  return candidates[0];
}

const USERS_FILE = resolveConfigFile('auth-users.txt');
const ADMIN_KEY_FILE = resolveConfigFile('admin-key.txt');

function parsePair(line) {
  const s = String(line || '').trim();
  if (!s || s.charAt(0) === '#') return null;
  const sep = s.indexOf(':') >= 0 ? ':' : (s.indexOf('|') >= 0 ? '|' : -1);
  if (sep <= 0) return null;
  const email = s.slice(0, sep).trim().toLowerCase();
  const password = s.slice(sep + 1);
  if (!email || !password) return null;
  return { email: email, password: password };
}

/** @returns {{ email: string, password: string }[]} */
export function readUsersFromFile() {
  try {
    if (!fs.existsSync(USERS_FILE)) return [];
    const raw = fs.readFileSync(USERS_FILE, 'utf8');
    const users = [];
    raw.split(/\r?\n/).forEach(function (line) {
      const u = parsePair(line);
      if (u) users.push(u);
    });
    return users;
  } catch {
    return [];
  }
}

/** @returns {string} */
export function readAdminKeyFromFile() {
  try {
    if (!fs.existsSync(ADMIN_KEY_FILE)) return '';
    return fs.readFileSync(ADMIN_KEY_FILE, 'utf8').trim().split(/\r?\n/)[0].trim();
  } catch {
    return '';
  }
}

export { USERS_FILE };
