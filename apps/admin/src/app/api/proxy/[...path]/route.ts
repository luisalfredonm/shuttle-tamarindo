import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy entre el panel y la API de NestJS.
 *
 * El JWT vive en una cookie httpOnly, así que el navegador no puede leerlo ni
 * adjuntarlo. Este handler corre en el servidor: saca el token de la cookie y
 * lo reenvía como Bearer. Así el token nunca queda expuesto a JavaScript.
 */

const API_URL =
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:4000/api';

const METHODS_WITHOUT_BODY = ['GET', 'HEAD'];

async function forward(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const { path } = await ctx.params;

  const token = req.cookies.get('admin_token')?.value;
  if (!token) {
    return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
  }

  const target = `${API_URL}/${path.join('/')}${req.nextUrl.search}`;
  const body = METHODS_WITHOUT_BODY.includes(req.method)
    ? undefined
    : await req.text();

  try {
    const res = await fetch(target, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: body || undefined,
      cache: 'no-store',
    });

    // Devolvemos el cuerpo tal cual para no perder los mensajes de error de Nest
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: {
        'Content-Type': res.headers.get('Content-Type') || 'application/json',
      },
    });
  } catch {
    return NextResponse.json(
      { message: 'No se pudo contactar la API' },
      { status: 502 },
    );
  }
}

export const GET = forward;
export const POST = forward;
export const PATCH = forward;
export const PUT = forward;
export const DELETE = forward;
