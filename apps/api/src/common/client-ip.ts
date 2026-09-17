/**
 * IP del visitante detras de los proxys de Render.
 *
 * req.ip devuelve la IP del proxy, asi que sin esto todo el trafico contaria
 * como un solo cliente y el limite se agotaria con las reservas de cualquiera.
 * cf-connecting-ip lo pone el borde de Cloudflare y no se puede falsear desde
 * afuera; el primer valor de x-forwarded-for si, pero el limite por IP es la
 * segunda linea de defensa (la primera es el captcha), no el candado.
 */
export function clientIp(req: {
  headers: Record<string, string | string[] | undefined>;
  ip?: string;
}): string {
  const cf = req.headers['cf-connecting-ip'];
  if (typeof cf === 'string' && cf) return cf;

  const forwarded = req.headers['x-forwarded-for'];
  const first = (Array.isArray(forwarded) ? forwarded[0] : forwarded)
    ?.split(',')[0]
    ?.trim();

  return first || req.ip || 'unknown';
}
