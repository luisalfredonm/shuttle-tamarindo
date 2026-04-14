import {
  IsString,
  IsInt,
  IsNumber,
  IsDateString,
  IsOptional,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTripDto {
  @IsString()
  routeId: string;

  @IsDateString()
  departureAt: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @IsNumber()
  @Type(() => Number)
  priceShared: number;

  @IsNumber()
  @Type(() => Number)
  pricePrivate: number;
}
