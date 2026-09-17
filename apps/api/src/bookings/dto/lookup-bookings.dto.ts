import { IsEmail, IsOptional, IsString } from 'class-validator';

/**
 * Pedido de "encuentra mi reserva": solo el correo.
 *
 * La respuesta nunca dice si ese correo tiene reservas; los enlaces salen por
 * correo. Asi esta pantalla no sirve para averiguar quien compro.
 */
export class LookupBookingsDto {
  @IsEmail()
  email: string;

  /** Token del captcha (Turnstile), si el servidor lo tiene activo */
  @IsOptional()
  @IsString()
  turnstileToken?: string;
}
