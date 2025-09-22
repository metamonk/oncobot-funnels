import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';
import { Logger } from '@/lib/logger';

const authRoutes = ['/sign-in', '/sign-up'];
const protectedRoutes = ['/settings'];
const adminRoutes = ['/admin'];
const logger = new Logger('Middleware');

export async function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  const { pathname } = request.nextUrl;
  
  // Only log pathname in debug mode
  logger.debug(`Processing: ${pathname}`);

  // /api/payments/webhooks is a webhook endpoint that should be accessible without authentication
  if (pathname.startsWith('/api/payments/webhooks')) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/polar/webhooks')) {
    return NextResponse.next();
  }

  // If user is authenticated but trying to access auth routes
  if (sessionCookie && authRoutes.some((route) => pathname.startsWith(route))) {
    logger.info(`Redirecting authenticated user from ${pathname} to home`);
    // Don't log session cookie for security
    logger.debug('Session exists, redirecting to home');
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (!sessionCookie && protectedRoutes.some((route) => pathname.startsWith(route))) {
    logger.info(`Redirecting unauthenticated user from ${pathname} to sign-in`);
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  // Admin routes - require authentication (role check will be done in layout)
  // But exclude /admin/login from this check
  if (adminRoutes.some((route) => pathname.startsWith(route)) && pathname !== '/admin/login') {
    if (!sessionCookie) {
      logger.info(`Redirecting unauthenticated user from admin route ${pathname} to /admin/login`);
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
