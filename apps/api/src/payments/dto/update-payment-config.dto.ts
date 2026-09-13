import { IsBoolean } from 'class-validator';

/**
 * Lo unico que se cambia desde el panel: si el metodo se ofrece o no.
 *
 * Credenciales, modo sandbox/live y clientId salen de variables de entorno del
 * servidor. No hay campo para ninguno a proposito: asi no existe un camino por
 * el que una credencial entre desde el navegador, ni forma de que el panel
 * diga "live" mientras el servidor tiene cargadas las de sandbox.
 */
export class UpdatePaymentConfigDto {
  @IsBoolean()
  isEnabled: boolean;
}
