import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.AUTH_SECRET!);

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('admin_token')?.value;
  const isLoginPage = req.nextUrl.pathname === '/login';

  if (token) {
    try {
      await jwtVerify(token, secret);
      if (isLoginPage) return NextResponse.redirect(new URL('/dashboard', req.url));
      return NextResponse.next();
    } catch {}
  }

  if (!isLoginPage) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next|favicon.ico).*)'],
};
