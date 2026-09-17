import { ForbiddenException } from '@nestjs/common';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { RequestUser } from '../auth/request-user';

export const NO_ACCESS = 'No tienes acceso a esta reserva';

/** Lo minimo que hace falta para decidir si alguien puede ver una reserva */
export interface ReservationOwnership {
  userId: string;
  accessToken: string | null;
  bookedAsGuest: boolean;
}

/** Enlace secreto de una reserva: 32 caracteres sin ambiguedad en una URL */
export function newAccessToken(): string {
  return randomBytes(24).toString('base64url');
}

/** Comparacion en tiempo constante: un token no se adivina midiendo respuestas */
function sameToken(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/**
 * Quien puede ver, pagar o cancelar una reserva.
 *
 *   ADMIN                          siempre
 *   quien trae el enlace secreto   siempre
 *   el dueño con sesion            solo si la reserva no se hizo como invitado
 *
 * La ultima regla es la que importa: el email no se verifica, asi que
 * registrarse con el correo de otra persona no puede abrir sus viajes de
 * invitado, que llevan hotel, vuelo y telefono.
 */
export function assertCanAccessReservation(
  reservation: ReservationOwnership,
  user?: RequestUser,
  token?: string,
) {
  if (user?.role === 'ADMIN') return;

  if (
    token &&
    reservation.accessToken &&
    sameToken(token, reservation.accessToken)
  ) {
    return;
  }

  if (user && user.id === reservation.userId && !reservation.bookedAsGuest) {
    return;
  }

  throw new ForbiddenException(NO_ACCESS);
}
