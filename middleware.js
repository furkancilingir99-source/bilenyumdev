import { isBlockedPath, isPublicPath, readCookie } from './lib/auth-public.mjs';
import {
  ACCESS_COOKIE,
  getJwtSecret,
  isAuthConfigured,
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
      'Giriş sistemi yapılandırılmamış. Vercel ortam değişkenlerine SUPABASE_URL, SUPABASE_ANON_KEY ve SUPABASE_JWT_SECRET ekleyin. Kurulum: config/SUPABASE-KURULUM.txt',
      { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
    );
  }

  const token = readCookie(request, ACCESS_COOKIE);
  const session = token ? await verifyAccessToken(token, getJwtSecret()) : null;

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
