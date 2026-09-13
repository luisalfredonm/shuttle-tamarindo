import { IsUUID } from 'class-validator';

export class CreateOrderDto {
  /** La reserva a pagar. El importe lo pone el servidor, no el cliente. */
  @IsUUID()
  reservationId: string;
}
