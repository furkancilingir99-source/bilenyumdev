import { isBlockedPath, isPublicPath, readCookie } from './lib/auth-public.mjs';
import {
  ACCESS_COOKIE,
  clearSessionCookieHeaders,
  isAuthConfigured,
  verifyAccessToken
} from './lib/supabase-auth-common.mjs';

function safeLoginUrl(origin, pathname, search, expired) {
  try {
    const loginUrl = new URL('/giris', origin || 'https://localhost');
    if (expired) loginUrl.searchParams.set('expired', '1');
    const fromPath = pathname && pathname !== '/giris' ? pathname : '/';
    loginUrl.searchParams.set('from', fromPath + (search || ''));
    return loginUrl.toString();
  } catch {
    return '/giris?expired=1';
  }
}

function redirectToLogin(origin, pathname, search, clearCookies) {
  const target = safeLoginUrl(origin, pathname, search, clearCookies);
  const headers = new Headers({ Location: target });
  if (clearCookies) {
    clearSessionCookieHeaders().forEach(function (c) {
      headers.append('Set-Cookie', c);
    });
  }
  return new Response(null, { status: 302, headers });
}

export default async function middleware(request) {
  let url;
  let pathname = '/';
  let origin = 'https://localhost';

  try {
    url = new URL(request.url);
    pathname = url.pathname || '/';
    origin = url.origin;
  } catch {
    return redirectToLogin(origin, pathname, '', true);
  }

  try {
    if (isBlockedPath(pathname)) {
      return new Response('Not Found', { status: 404 });
    }

    if (isPublicPath(pathname)) {
      return;
    }

    if (!isAuthConfigured()) {
      return new Response(
        'Giriş sistemi yapılandırılmamış. Vercel → Settings → Environment Variables:\nSUPABASE_URL ve SUPABASE_ANON_KEY ekleyin, sonra Redeploy.\n\nKurulum: config/SUPABASE-KURULUM.txt',
        { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
      );
    }

    const accessToken = readCookie(request, ACCESS_COOKIE);
    let session = null;

    if (accessToken) {
      try {
        session = await verifyAccessToken(accessToken);
      } catch {
        session = null;
      }
    }

    if (session) {
      return;
    }

    return redirectToLogin(origin, pathname, url.search, !!accessToken);
  } catch (err) {
    console.error('[middleware]', err);
    return redirectToLogin(origin, pathname, url.search || '', true);
  }
}

export const config = {
  matcher: ['/((?!_vercel|_next/static|_next/image).*)']
};
