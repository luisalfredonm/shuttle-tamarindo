import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PayPalProvider } from './providers/paypal.provider';
import { PaymentProvider } from './providers/payment-provider.interface';

/** Metodos que el sistema conoce, existan o no en la base todavia */
const KNOWN_PROVIDERS = [
  { provider: 'PAYPAL' as const, label: 'PayPal', sortOrder: 0 },
  { provider: 'BAC_CREDOMATIC' as const, label: 'BAC Credomatic', sortOrder: 1 },
];

@Injectable()
export class PaymentConfigService {
  constructor(
    private prisma: PrismaService,
    private paypal: PayPalProvider,
  ) {}

  private providerFor(name: string): PaymentProvider | undefined {
    return name === 'PAYPAL' ? this.paypal : undefined;
  }

  /**
   * Estado de cada metodo para el panel.
   *
   * Devuelve si las credenciales estan puestas, nunca las credenciales. El
   * secret no sale de las variables de entorno del servidor: si viajara al
   * navegador para llenar un formulario, bastaria un XSS en el panel para
   * llevarselo.
   */
  async list() {
    const saved = await this.prisma.paymentMethodConfig.findMany();
    const byProvider = new Map(saved.map((c) => [c.provider, c]));

    return KNOWN_PROVIDERS.map(({ provider, label, sortOrder }) => {
      const config = byProvider.get(provider);
      const impl = this.providerFor(provider);

      return {
        provider,
        label,
        sortOrder: config?.sortOrder ?? sortOrder,
        isEnabled: config?.isEnabled ?? false,
        /** Del entorno: depende de que credenciales hay cargadas */
        mode: impl ? impl.mode() : null,
        /** clientId recortado: alcanza para reconocerlo sin copiarlo entero */
        publicKeyHint: impl?.publicKey() ? maskKey(impl.publicKey()!) : null,
        /** false cuando el proveedor todavia no tiene implementacion */
        isSupported: !!impl,
        /** true cuando el entorno tiene las credenciales cargadas */
        hasCredentials: impl ? impl.isConfigured() : false,
        updatedAt: config?.updatedAt ?? null,
      };
    });
  }

  async update(provider: string, data: { isEnabled?: boolean }) {
    const known = KNOWN_PROVIDERS.find((p) => p.provider === provider);
    if (!known) throw new NotFoundException('Metodo de pago desconocido');

    const impl = this.providerFor(provider);

    // Prender un metodo sin credenciales dejaria al cliente frente a un boton
    // que falla al tocarlo: se avisa acá y no en el checkout.
    if (data.isEnabled && (!impl || !impl.isConfigured())) {
      throw new NotFoundException(
        !impl
          ? `${known.label} todavia no esta implementado`
          : `Faltan las credenciales de ${known.label} en el servidor`,
      );
    }

    return this.prisma.paymentMethodConfig.upsert({
      where: { provider: provider as any },
      create: {
        provider: provider as any,
        isEnabled: data.isEnabled ?? false,
        sortOrder: known.sortOrder,
      },
      update: {
        ...(data.isEnabled !== undefined && { isEnabled: data.isEnabled }),
      },
    });
  }

  /** Prueba las credenciales del entorno contra la pasarela */
  async verify(provider: string) {
    const impl = this.providerFor(provider);
    if (!impl) {
      return { ok: false, detail: 'Metodo no implementado todavia' };
    }
    return impl.verifyCredentials();
  }
}

/** "AQMDBOiU8YD9...fLFwfg" -> "AQMDBO…LFwfg" */
function maskKey(key: string): string {
  return key.length <= 12 ? key : `${key.slice(0, 6)}…${key.slice(-5)}`;
}
