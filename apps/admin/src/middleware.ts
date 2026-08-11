import { NextRequest, NextResponse } from 'next/server';
import { decodeJwt } from 'jose';

/**
 * Gate de navegación del panel.
 *
 * Solo decodifica el token para ver si sigue vigente; NO verifica la firma a
 * propósito: el secreto de firma vive únicamente en la API, que es quien
 * autoriza de verdad en cada request (JwtAuthGuard + RolesGuard). Acá basta
 * con evitar renderizar el panel a quien no trae sesión.
 */
export async function middleware(req: NextRequest) {
  const token = req.cookies.get('admin_token')?.value;
  const isLoginPage = req.nextUrl.pathname === '/login';

  let validSession = false;
  if (token) {
    try {
      const { exp } = decodeJwt(token);
      validSession = !!exp && exp * 1000 > Date.now();
    } catch {
      validSession = false;
    }
  }

  if (validSession) {
    if (isLoginPage) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    return NextResponse.next();
  }

  if (!isLoginPage) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next|favicon.ico).*)'],
};
