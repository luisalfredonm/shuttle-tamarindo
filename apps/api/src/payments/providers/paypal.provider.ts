import { Injectable, Logger } from '@nestjs/common';
import {
  CaptureResult,
  CreatedOrder,
  PaymentProvider,
} from './payment-provider.interface';

const SANDBOX_API = 'https://api-m.sandbox.paypal.com';
const LIVE_API = 'https://api-m.paypal.com';

/**
 * PayPal Orders API v2.
 *
 * El cobro va en dos tiempos: se crea la orden en el servidor, el cliente la
 * aprueba en el widget de PayPal y despues el servidor la captura. Nunca se
 * confia en el navegador para decir que se pago: la captura la hace el backend
 * contra la API y recien ahi la reserva pasa a CONFIRMED.
 *
 * Las credenciales se leen del entorno y no de la base a proposito. El
 * clientId es publico (viaja en el SDK del navegador); el secret no sale nunca
 * de este proceso.
 */
@Injectable()
export class PayPalProvider implements PaymentProvider {
  readonly name = 'PAYPAL' as const;
  private readonly logger = new Logger(PayPalProvider.name);

  /** Token de aplicacion cacheado: PayPal lo emite por horas */
  private token?: { value: string; expiresAt: number };

  private get isSandbox(): boolean {
    return process.env.PAYPAL_MODE !== 'live';
  }

  private get apiBase(): string {
    return this.isSandbox ? SANDBOX_API : LIVE_API;
  }

  private get clientId(): string | undefined {
    return process.env.PAYPAL_CLIENT_ID;
  }

  private get clientSecret(): string | undefined {
    return process.env.PAYPAL_CLIENT_SECRET;
  }

  isConfigured(): boolean {
    return !!this.clientId && !!this.clientSecret;
  }

  mode(): 'sandbox' | 'live' {
    return this.isSandbox ? 'sandbox' : 'live';
  }

  publicKey(): string | null {
    return this.clientId ?? null;
  }

  async verifyCredentials(): Promise<{ ok: boolean; detail: string }> {
    if (!this.isConfigured()) {
      return {
        ok: false,
        detail: 'Faltan PAYPAL_CLIENT_ID o PAYPAL_CLIENT_SECRET en el entorno',
      };
    }

    try {
      await this.accessToken(true);
      return {
        ok: true,
        detail: `Credenciales validas en ${this.isSandbox ? 'sandbox' : 'produccion'}`,
      };
    } catch (error) {
      // El detalle es para el admin, no para el cliente final
      return { ok: false, detail: this.readError(error) };
    }
  }

  /**
   * Token OAuth2 de aplicacion.
   *
   * Se cachea hasta un minuto antes de que expire para no pedir uno por cada
   * cobro, y nunca se registra en los logs.
   */
  private async accessToken(force = false): Promise<string> {
    const now = Date.now();
    if (!force && this.token && this.token.expiresAt > now) {
      return this.token.value;
    }

    const basic = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString(
      'base64',
    );

    const res = await fetch(`${this.apiBase}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!res.ok) {
      throw new Error(
        `PayPal rechazo las credenciales (HTTP ${res.status})`,
      );
    }

    const data = (await res.json()) as {
      access_token: string;
      expires_in: number;
    };

    this.token = {
      value: data.access_token,
      expiresAt: now + (data.expires_in - 60) * 1000,
    };

    return this.token.value;
  }

  async createOrder(input: {
    amount: number;
    currency: string;
    reservationId: string;
    description: string;
  }): Promise<CreatedOrder> {
    const token = await this.accessToken();

    const res = await fetch(`${this.apiBase}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        // Si el cliente reintenta, PayPal devuelve la misma orden en vez de
        // abrir una segunda por la misma reserva
        'PayPal-Request-Id': `reservation-${input.reservationId}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: input.reservationId,
            description: input.description.slice(0, 127),
            amount: {
              currency_code: input.currency,
              value: input.amount.toFixed(2),
            },
          },
        ],
        payment_source: {
          paypal: {
            experience_context: {
              shipping_preference: 'NO_SHIPPING',
              user_action: 'PAY_NOW',
            },
          },
        },
      }),
    });

    const data = (await res.json()) as {
      id?: string;
      links?: { rel: string; href: string }[];
    };

    if (!res.ok || !data.id) {
      throw new Error(`PayPal no pudo crear la orden (HTTP ${res.status})`);
    }

    return {
      orderId: data.id,
      approveUrl: data.links?.find((l) => l.rel === 'payer-action')?.href,
    };
  }

  async captureOrder(orderId: string): Promise<CaptureResult> {
    const token = await this.accessToken();

    const res = await fetch(
      `${this.apiBase}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          // Capturar dos veces la misma orden devuelve la captura original
          'PayPal-Request-Id': `capture-${orderId}`,
        },
      },
    );

    const data = (await res.json()) as any;

    if (!res.ok) {
      const detail = data?.details?.[0]?.issue ?? `HTTP ${res.status}`;
      this.logger.warn(`Captura rechazada para ${orderId}: ${detail}`);
      return { success: false, error: detail };
    }

    const capture = data?.purchase_units?.[0]?.payments?.captures?.[0];

    if (data?.status !== 'COMPLETED' || !capture) {
      return {
        success: false,
        error: `Estado inesperado: ${data?.status ?? 'desconocido'}`,
      };
    }

    return {
      success: true,
      transactionId: capture.id,
      amount: Number(capture.amount?.value),
      currency: capture.amount?.currency_code,
    };
  }

  /**
   * Verifica la firma del webhook contra PayPal.
   *
   * Sin esto el endpoint es una via publica para marcar reservas como pagadas.
   * Si falta PAYPAL_WEBHOOK_ID se rechaza en vez de dejar pasar: preferible un
   * webhook que no funciona a uno que acepta cualquier cosa.
   */
  async verifyWebhook(
    headers: Record<string, unknown>,
    rawBody: string,
  ): Promise<boolean> {
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;
    if (!webhookId) {
      this.logger.error('Falta PAYPAL_WEBHOOK_ID: se rechaza el webhook');
      return false;
    }

    const header = (name: string) => String(headers[name] ?? '');

    try {
      const token = await this.accessToken();
      const res = await fetch(
        `${this.apiBase}/v1/notifications/verify-webhook-signature`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            auth_algo: header('paypal-auth-algo'),
            cert_url: header('paypal-cert-url'),
            transmission_id: header('paypal-transmission-id'),
            transmission_sig: header('paypal-transmission-sig'),
            transmission_time: header('paypal-transmission-time'),
            webhook_id: webhookId,
            webhook_event: JSON.parse(rawBody),
          }),
        },
      );

      if (!res.ok) return false;

      const data = (await res.json()) as { verification_status?: string };
      return data.verification_status === 'SUCCESS';
    } catch (error) {
      this.logger.error(`No se pudo verificar el webhook: ${this.readError(error)}`);
      return false;
    }
  }

  /** Mensaje de error sin filtrar credenciales al log */
  private readError(error: unknown): string {
    return error instanceof Error ? error.message : 'Error desconocido';
  }
}
