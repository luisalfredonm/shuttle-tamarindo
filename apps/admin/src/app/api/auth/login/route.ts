import { NextRequest, NextResponse } from 'next/server';

/**
 * Login del panel contra la API real.
 *
 * Antes esto validaba una contraseña compartida (ADMIN_PASSWORD) y firmaba su
 * propio JWT, que la API nunca veía. Ahora delega en /auth/login de NestJS y
 * guarda el token de la API: una sola identidad, y cada acción queda atribuida
 * a un usuario concreto.
 */

const API_URL =
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:4000/api';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json(
      { message: 'Email y contraseña son obligatorios' },
      { status: 400 },
    );
  }

  let data: any;
  try {
    const apiRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      cache: 'no-store',
    });
    data = await apiRes.json();

    if (!apiRes.ok) {
      return NextResponse.json(
        { message: data?.message || 'Credenciales inválidas' },
        { status: 401 },
      );
    }
  } catch {
    return NextResponse.json(
      { message: 'No se pudo contactar la API' },
      { status: 502 },
    );
  }

  // Autenticarse no alcanza: este panel es solo para ADMIN
  if (data?.user?.role !== 'ADMIN') {
    return NextResponse.json(
      { message: 'Esta cuenta no tiene acceso al panel' },
      { status: 403 },
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set('admin_token', data.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });
  return res;
}
