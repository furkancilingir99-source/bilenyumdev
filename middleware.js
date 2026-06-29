import {
  isPublicPath,
  readCookie,
  verifySessionToken
} from './lib/auth-token.mjs';

export default async function middleware(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  if (isPublicPath(pathname)) return;

  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    return new Response(
      'Site koruması yapılandırılmamış. Vercel ortam değişkenlerine AUTH_SECRET ekleyin.',
      { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
    );
  }

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
