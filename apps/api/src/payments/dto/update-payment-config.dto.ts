import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Solo configuracion, nunca secretos.
 *
 * El client secret y las api keys se leen de variables de entorno del
 * servidor; este DTO no las acepta a proposito, para que no exista un camino
 * por el que una credencial entre desde el navegador.
 */
export class UpdatePaymentConfigDto {
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  isSandbox?: boolean;

  /** Identificador publico (clientId de PayPal), no un secreto */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  publicKey?: string;
}
