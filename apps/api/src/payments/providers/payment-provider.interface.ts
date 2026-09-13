/**
 * Contrato que cumple cada pasarela.
 *
 * El servicio de pagos habla contra esta interfaz y no contra PayPal, para que
 * sumar BAC Credomatic mas adelante no toque el flujo de reservas: se agrega
 * otra implementacion y se prende desde el panel.
 */
export interface CreatedOrder {
  /** Id de la orden en el proveedor. Se guarda antes de cobrar. */
  orderId: string;
  /** URL de aprobacion, cuando el proveedor redirige en vez de usar un widget */
  approveUrl?: string;
}

export interface CaptureResult {
  success: boolean;
  /** Id de la transaccion ya cobrada */
  transactionId?: string;
  /**
   * Importe que el proveedor dice haber cobrado.
   *
   * Se devuelve para poder contrastarlo contra el de la reserva: es la unica
   * forma de detectar que se cobro algo distinto de lo que la reserva vale.
   */
  amount?: number;
  currency?: string;
  error?: string;
}

export interface PaymentProvider {
  /** Nombre en PaymentMethodConfig.provider */
  readonly name: 'PAYPAL' | 'BAC_CREDOMATIC';

  /** false cuando faltan credenciales en el entorno */
  isConfigured(): boolean;

  /**
   * Modo segun las credenciales cargadas.
   *
   * Sale del entorno y no de un interruptor del panel: sandbox y live usan
   * pares de credenciales distintos, asi que marcar "live" con credenciales de
   * sandbox solo produciria cobros fallidos.
   */
  mode(): 'sandbox' | 'live';

  /**
   * Identificador publico que necesita el SDK del navegador.
   *
   * Tambien del entorno: si se cargara aparte y no coincidiera con el secret
   * del servidor, el boton abriria pero la orden no se podria aprobar.
   */
  publicKey(): string | null;

  /** Prueba las credenciales contra el proveedor, para el boton del panel */
  verifyCredentials(): Promise<{ ok: boolean; detail: string }>;

  /**
   * Reserva el cobro en el proveedor.
   *
   * El importe lo pone el servidor a partir de la reserva, nunca el cliente.
   */
  createOrder(input: {
    amount: number;
    currency: string;
    reservationId: string;
    description: string;
  }): Promise<CreatedOrder>;

  /** Cobra una orden ya aprobada por el cliente */
  captureOrder(orderId: string): Promise<CaptureResult>;

  /**
   * Confirma que el aviso vino del proveedor y no de un tercero.
   *
   * Un webhook sin verificar es un endpoint publico que mueve el estado de los
   * pagos: cualquiera podria marcar una reserva como pagada.
   */
  verifyWebhook(headers: Record<string, unknown>, rawBody: string): Promise<boolean>;
}
