import {
  IsEmail,
  IsString,
  IsInt,
  IsEnum,
  IsOptional,
  IsDateString,
  IsNotEmpty,
  Min,
  Max,
  MaxLength,
} from 'class-validator';

export enum BookingTypeEnum {
  SHARED = 'SHARED',
  PRIVATE = 'PRIVATE',
}

export class CreateBookingDto {
  /**
   * SHARED elige un horario ya precargado: viene con tripId.
   * PRIVATE elige cualquier hora: viene con routeSlug + departureAt, y el
   * Trip para esa salida puntual se crea al vuelo en BookingsService.
   */
  @IsOptional()
  @IsString()
  tripId?: string;

  @IsOptional()
  @IsString()
  routeSlug?: string;

  @IsOptional()
  @IsDateString()
  departureAt?: string;

  /** Presente solo en ida y vuelta: la salida del tramo de regreso (SHARED) */
  @IsOptional()
  @IsString()
  returnTripId?: string;

  /** Ida y vuelta en PRIVATE: ruta y hora del regreso */
  @IsOptional()
  @IsString()
  returnRouteSlug?: string;

  @IsOptional()
  @IsDateString()
  returnDepartureAt?: string;

  // userId NO se acepta del cliente: sale del JWT en el controller

  @IsEnum(BookingTypeEnum)
  type: BookingTypeEnum;

  /**
   * Pasajeros que pagan: adultos y ninos. El tope real es la capacidad de la
   * van, que se edita desde el panel y la valida el servicio.
   */
  @IsInt()
  @Min(1)
  @Max(50)
  passengers: number;

  /** Infantes de 0 a 2 anos: no pagan pero ocupan asiento. Solo en privado. */
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(50)
  infants?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  /** Solo tiene sentido en rutas que tocan el aeropuerto */
  @IsOptional()
  @IsString()
  flightNumber?: string;

  /** Hotel o dirección exacta de pickup/dropoff puerta a puerta */
  @IsOptional()
  @IsString()
  pickupAddress?: string;

  /**
   * Firma tipeada de la política de cancelación. Es obligatoria: sin esto
   * no hay reserva. La fecha de firma la pone el servidor, no el cliente.
   */
  @IsString()
  @IsNotEmpty()
  agreementSignedName: string;

  /**
   * Contacto de quien reserva sin cuenta. Los tres son obligatorios en ese
   * caso y el servicio los exige; van opcionales aca porque con sesion los
   * datos salen del usuario y no del formulario.
   */
  @IsOptional()
  @IsString()
  @MaxLength(120)
  guestName?: string;

  @IsOptional()
  @IsEmail()
  guestEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  guestPhone?: string;

  /** Token del captcha (Turnstile). Solo se pide si el servidor lo tiene activo. */
  @IsOptional()
  @IsString()
  turnstileToken?: string;
}
