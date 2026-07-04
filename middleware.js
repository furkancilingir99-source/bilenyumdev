import { isBlockedPath, isPublicPath, readCookie } from './lib/auth-public.mjs';
import {
  ACCESS_COOKIE,
  clearSessionCookieHeaders,
  isAuthConfigured,
  verifyAccessToken
} from './lib/supabase-auth-common.mjs';

function redirectToLogin(url, pathname, clearCookies) {
  const loginUrl = new URL('/giris', url.origin);
  if (clearCookies) loginUrl.searchParams.set('expired', '1');
  const safePath = pathname || '/';
  loginUrl.searchParams.set('from', safePath + url.search);
  const response = Response.redirect(loginUrl.toString(), 302);
  if (clearCookies) {
    clearSessionCookieHeaders().forEach(function (c) {
      response.headers.append('Set-Cookie', c);
    });
  }
  return response;
}

export default async function middleware(request) {
  try {
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
    const session = accessToken ? await verifyAccessToken(accessToken) : null;

    if (session) return;

    return redirectToLogin(url, pathname, !!accessToken);
  } catch (err) {
    console.error('[middleware]', err);
    return redirectToLogin(new URL(request.url), new URL(request.url).pathname, true);
  }
}

export const config = {
  matcher: ['/((?!_vercel|_next/static|_next/image).*)']
};
