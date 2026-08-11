import { IsString, IsInt, IsEnum, IsOptional, Min, Max } from 'class-validator';

export enum BookingTypeEnum {
  SHARED = 'SHARED',
  PRIVATE = 'PRIVATE',
}

export class CreateBookingDto {
  @IsString()
  tripId: string;

  /** Presente solo en ida y vuelta: la salida del tramo de regreso */
  @IsOptional()
  @IsString()
  returnTripId?: string;

  // userId NO se acepta del cliente: sale del JWT en el controller

  @IsEnum(BookingTypeEnum)
  type: BookingTypeEnum;

  @IsInt()
  @Min(1)
  @Max(10)
  passengers: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
