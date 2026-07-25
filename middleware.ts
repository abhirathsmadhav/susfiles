import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protect /admin routes — redirect unauthenticated users to /admin/login
// Note: Full role-based check happens client-side in AuthGuard
// (Firebase ID tokens aren't easily verifiable in Edge middleware without custom claims)
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow access to /admin/login always
  if (pathname === '/admin/login') return NextResponse.next();

  // For other /admin routes, check for a session cookie
  // Firebase sets __session cookie when using session cookies, but with client-side auth
  // we rely on AuthGuard component for full protection. Middleware does a basic check.
  if (pathname.startsWith('/admin')) {
    // We use a simple flag cookie set by the client after login
    const sessionCookie = request.cookies.get('sus-session');
    if (!sessionCookie) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
