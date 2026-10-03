import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { BookingTypeEnum } from './create-booking.dto';

export enum PayOnSiteMethodEnum {
  CASH = 'CASH',
  CARD = 'CARD',
  SINPE = 'SINPE',
}

/**
 * Reserva que carga el admin desde el panel (cliente que escribio por
 * WhatsApp o llamo). Los tramos se eligen igual que en la web; lo que cambia
 * es que el contacto lo tipea el admin y el pago se hace en el sitio.
 */
export class CreateManualBookingDto {
  @IsEnum(BookingTypeEnum)
  type: BookingTypeEnum;

  /** SHARED: salida ya generada */
  @IsOptional()
  @IsString()
  tripId?: string;

  /** PRIVATE: ruta y hora libre */
  @IsOptional()
  @IsString()
  routeSlug?: string;

  @IsOptional()
  @IsDateString()
  departureAt?: string;

  @IsOptional()
  @IsString()
  returnTripId?: string;

  @IsOptional()
  @IsString()
  returnRouteSlug?: string;

  @IsOptional()
  @IsDateString()
  returnDepartureAt?: string;

  @IsInt()
  @Min(1)
  @Max(50)
  passengers: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(50)
  infants?: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  customerName: string;

  /** Obligatorio: es a donde llega el comprobante con el enlace de la reserva */
  @IsEmail()
  customerEmail: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  customerPhone: string;

  @IsOptional()
  @IsString()
  pickupAddress?: string;

  @IsOptional()
  @IsString()
  flightNumber?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsEnum(PayOnSiteMethodEnum)
  paymentMethod: PayOnSiteMethodEnum;

  /**
   * Total acordado con el cliente, si difiere del que calcula el sistema
   * (un descuento, un precio especial). Vacio = precio normal.
   */
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100000)
  totalAmount?: number;
}
