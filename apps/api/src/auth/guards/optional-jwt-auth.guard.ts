import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Sesion opcional: deja pasar al visitante sin token.
 *
 * Lo usan las pantallas de reserva y pago, que ahora sirven a dos clientes: el
 * que tiene cuenta (llega con Bearer) y el invitado (llega con el enlace
 * secreto de su reserva). Quien decide si puede ver la reserva es el servicio,
 * no este guard.
 *
 * Un Authorization presente pero invalido sigue siendo 401, no un invitado: si
 * la sesion vencio, el visitante tiene que enterarse en vez de que su reserva
 * se registre como si no tuviera cuenta.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
    }>();

    if (!req.headers.authorization) return true;
    return super.canActivate(context);
  }
}
