import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;

  // Allow root
  if (pathname === '/') {
    return NextResponse.next();
  }

  // Allow static files (e.g., .svg, .png, .ico, .txt, etc.)
  if (/\.[^/]+$/.test(pathname)) {
    return NextResponse.next();
  }

  const isPublic = PUBLIC_PATHS.includes(pathname);

  // Debug logging (remove in production)
  console.log(`[Middleware] ${pathname} - Token: ${token ? 'exists' : 'none'} - Public: ${isPublic}`);

  // Redirect authenticated users away from auth pages
  if (token && (pathname === '/login' || pathname === '/register')) {
    console.log(`[Middleware] Redirecting authenticated user from ${pathname} to /dashboard`);
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Protect private routes
  if (!token && !isPublic) {
    console.log(`[Middleware] Redirecting unauthenticated user from ${pathname} to /login`);
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|static|images|fonts|assets).*)',
  ],
};
