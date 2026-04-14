import { IsString, IsInt, IsEnum, IsOptional, Min, Max } from 'class-validator';

export enum BookingTypeEnum {
  SHARED = 'SHARED',
  PRIVATE = 'PRIVATE',
}

export class CreateBookingDto {
  @IsString()
  tripId: string;

  @IsString()
  userId: string;

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
