import { getAuthSecret } from './lib/auth-config.mjs';
import {
  isPublicPath,
  readCookie,
  verifySessionToken
} from './lib/auth-token.mjs';

export default async function middleware(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  if (isPublicPath(pathname)) return;

  const secret = getAuthSecret();
  const token = readCookie(request, 'bilenyum_session');
  const session = token ? await verifySessionToken(secret, token) : null;

  if (session) return;

  const loginUrl = new URL('/giris', url.origin);
  if (pathname && pathname !== '/') {
    loginUrl.searchParams.set('from', pathname + url.search);
  }
  return Response.redirect(loginUrl.toString(), 302);
}

export const config = {
  matcher: ['/((?!_vercel|_next/static|_next/image).*)']
};
