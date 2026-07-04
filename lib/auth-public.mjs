/** @param {string} pathname */
export function isBlockedPath(pathname) {
  if (!pathname) return false;
  if (pathname.startsWith('/config/')) return true;
  if (pathname.startsWith('/lib/')) return true;
  return false;
}

/** @param {string} pathname */
export function isPublicPath(pathname) {
  if (!pathname || pathname === '/giris' || pathname === '/giris.html') return true;
  if (pathname === '/login' || pathname === '/login.html') return true;
  if (pathname === '/sifremi-unuttum' || pathname === '/sifremi-unuttum.html') return true;
  if (pathname.startsWith('/api/login') || pathname.startsWith('/api/logout') || pathname.startsWith('/api/session-check')) return true;
  if (pathname.startsWith('/assets/')) return true;
  if (pathname === '/favicon.ico') return true;
  if (/\.(css|js|svg|png|jpg|jpeg|gif|webp|woff2?|ico|map)$/i.test(pathname)) return true;
  return false;
}

/**
 * @param {Request} request
 * @param {string} name
 */
export function readCookie(request, name) {
  if (request.cookies && typeof request.cookies.get === 'function') {
    const c = request.cookies.get(name);
    if (c && c.value) return c.value;
  }
  const header = request.headers.get('cookie') || '';
  const re = new RegExp('(?:^|;\\s*)' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)');
  const m = header.match(re);
  if (!m) return '';
  try {
    return decodeURIComponent(m[1]);
  } catch {
    return '';
  }
}
