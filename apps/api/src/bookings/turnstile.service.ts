import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/**
 * Captcha invisible de Cloudflare para las reservas sin sesion.
 *
 * Queda apagado mientras no haya TURNSTILE_SECRET_KEY: asi el checkout de
 * invitado puede salir antes de tener las llaves, y prenderlo despues es solo
 * cargar la variable en el servidor y la del sitio en la web.
 */
@Injectable()
export class TurnstileService {
  private readonly logger = new Logger(TurnstileService.name);

  constructor(private config: ConfigService) {}

  get enabled(): boolean {
    return !!this.config.get<string>('TURNSTILE_SECRET_KEY');
  }

  async verify(token?: string, ip?: string) {
    const secret = this.config.get<string>('TURNSTILE_SECRET_KEY');
    if (!secret) return;

    if (!token) {
      throw new BadRequestException(
        'Falta la verificacion anti-bots. Recarga la pagina e intenta de nuevo.',
      );
    }

    const body = new URLSearchParams({ secret, response: token });
    if (ip) body.set('remoteip', ip);

    let success = false;
    try {
      const res = await fetch(VERIFY_URL, { method: 'POST', body });
      const data = (await res.json()) as {
        success?: boolean;
        'error-codes'?: string[];
      };
      success = !!data.success;
      if (!success) {
        this.logger.warn(
          `Turnstile rechazo el token: ${JSON.stringify(data['error-codes'])}`,
        );
      }
    } catch (err) {
      // Si Cloudflare no responde no se bloquea la venta: el captcha es una
      // defensa contra bots, no parte del cobro
      this.logger.error(`Turnstile no respondio: ${err}`);
      return;
    }

    if (!success) {
      throw new BadRequestException(
        'No pudimos verificar que no eres un bot. Recarga la pagina e intenta de nuevo.',
      );
    }
  }
}
