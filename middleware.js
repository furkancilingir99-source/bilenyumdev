import { next } from '@vercel/functions';
import { isBlockedPath, isPublicPath, readCookie } from './lib/auth-public.mjs';
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  buildSessionCookies,
  isAuthConfigured,
  refreshSession,
  verifyAccessToken
} from './lib/supabase-session.mjs';

export default async function middleware(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  if (isBlockedPath(pathname)) {
    return new Response('Not Found', { status: 404 });
  }

  if (isPublicPath(pathname)) return;

  if (!isAuthConfigured()) {
    return new Response(
      'Giriş sistemi yapılandırılmamış. Vercel → Settings → Environment Variables:\nSUPABASE_URL ve SUPABASE_ANON_KEY ekleyin, sonra Redeploy.\n\nKurulum: config/SUPABASE-KURULUM.txt',
      { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
    );
  }

  const accessToken = readCookie(request, ACCESS_COOKIE);
  let session = accessToken ? await verifyAccessToken(accessToken) : null;
  let renewed = null;

  if (!session) {
    const refreshToken = readCookie(request, REFRESH_COOKIE);
    if (refreshToken) {
      renewed = await refreshSession(refreshToken);
      if (renewed && renewed.access_token) {
        session = await verifyAccessToken(renewed.access_token);
      }
    }
  }

  if (session) {
    if (renewed) {
      const response = next({ request });
      buildSessionCookies(renewed).forEach(function (c) {
        response.headers.append('Set-Cookie', c);
      });
      return response;
    }
    return;
  }

  const loginUrl = new URL('/giris', url.origin);
  if (pathname && pathname !== '/') {
    loginUrl.searchParams.set('from', pathname + url.search);
  }
  return Response.redirect(loginUrl.toString(), 302);
}

export const config = {
  matcher: ['/((?!_vercel|_next/static|_next/image).*)']
};
