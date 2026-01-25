import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextRequest, NextResponse } from 'next/server';

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if the pathname already has a locale
  const pathnameHasLocale = routing.locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  // If no locale in pathname and user is on root path, check cookie preference
  if (!pathnameHasLocale && pathname === '/') {
    const preferredLanguage = request.cookies.get('preferredLanguage')?.value;

    // Only redirect if preferred language is valid AND different from default locale
    // (with localePrefix: 'as-needed', the default locale doesn't have a prefix,
    // so redirecting to /en when en is default would cause an infinite loop)
    if (
      preferredLanguage &&
      preferredLanguage !== routing.defaultLocale &&
      (routing.locales as readonly string[]).includes(preferredLanguage)
    ) {
      const url = request.nextUrl.clone();
      url.pathname = `/${preferredLanguage}`;
      return NextResponse.redirect(url);
    }
  }

  return intlMiddleware(request);
}

export const config = {
  // Match only internationalized pathnames, exclude API routes
  matcher: ['/', '/(fr|en)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)'],
};
