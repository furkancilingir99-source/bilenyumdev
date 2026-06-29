/** Varsayılan gizli anahtar — Vercel env yoksa otomatik kullanılır (özel repo / ekip içi). */
export const DEFAULT_AUTH_SECRET = 'bilenyum-ekip-2026-gizli-anahtar-32';

/** @returns {string} */
export function getAuthSecret() {
  const s = process.env.AUTH_SECRET;
  if (s && s.length >= 16) return s;
  return DEFAULT_AUTH_SECRET;
}

/** @returns {string} */
export function getAdminStatusKey() {
  const k = process.env.AUTH_ADMIN_KEY;
  if (k && k.trim()) return k.trim();
  return 'bilenyum-ekip-2026';
}
