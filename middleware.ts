import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

import { AUTH_CONFIG } from '@/server/config/auth';

const getJwtSecretKey = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) return new Uint8Array(0);
  return new TextEncoder().encode(secret);
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  const isAdminRoute = pathname.startsWith('/admin');
  const isOwnerRoute = pathname.startsWith('/owner');

  if (isAdminRoute || isOwnerRoute) {
    const token = request.cookies.get(AUTH_CONFIG.SESSION_COOKIE_NAME)?.value;
    
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      const { payload } = await jwtVerify(token, getJwtSecretKey(), {
        algorithms: [AUTH_CONFIG.JWT_ALGORITHM],
      });
      const role = payload.role as string;
      
      if (!payload.sub || !payload.exp) {
        throw new Error("Missing claims");
      }

      if (isAdminRoute && role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/', request.url));
      }
      
      if (isOwnerRoute && role !== 'OWNER' && role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/', request.url));
      }

    } catch (error) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete(AUTH_CONFIG.SESSION_COOKIE_NAME);
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/owner/:path*'],
};

