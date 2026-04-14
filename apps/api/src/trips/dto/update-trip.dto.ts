import { IsDateString, IsEnum, IsInt, IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { TripStatus } from '@shuttle/database';

export class UpdateTripDto {
  @IsOptional()
  @IsDateString()
  departureAt?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  priceShared?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  pricePrivate?: number;

  @IsOptional()
  @IsEnum(TripStatus)
  status?: TripStatus;
}
