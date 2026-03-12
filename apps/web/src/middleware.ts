import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ADMIN_ROUTES = ['/admin'];
const CUSTOMER_ONLY_ROUTES = ['/mi-cuenta', '/checkout'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionType = request.cookies.get('session_type')?.value;

  // Admin user trying to access customer-only routes → redirect to admin dashboard
  if (sessionType === 'admin') {
    const isCustomerRoute = CUSTOMER_ONLY_ROUTES.some((r) => pathname.startsWith(r));
    if (isCustomerRoute) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  // Non-admin user trying to access admin routes → redirect to store
  if (sessionType && sessionType !== 'admin') {
    const isAdminRoute = ADMIN_ROUTES.some((r) => pathname.startsWith(r));
    if (isAdminRoute) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // No session cookie + trying to access admin → redirect to login
  if (!sessionType) {
    const isAdminRoute = ADMIN_ROUTES.some((r) => pathname.startsWith(r));
    if (isAdminRoute) {
      return NextResponse.redirect(new URL('/login?redirect=/admin', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/mi-cuenta/:path*', '/checkout/:path*'],
};
