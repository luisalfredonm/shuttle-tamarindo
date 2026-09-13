import { IsString, MaxLength, MinLength } from 'class-validator';

export class CaptureOrderDto {
  /** Id de la orden que devolvio la pasarela al crearla */
  @IsString()
  @MinLength(6)
  @MaxLength(64)
  orderId: string;
}
