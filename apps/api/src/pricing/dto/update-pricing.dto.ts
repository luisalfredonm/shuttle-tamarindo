import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdatePricingDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  includedPassengers?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  extraPassengerPrice?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  vehicleCapacity?: number;

  @IsOptional()
  @IsBoolean()
  taxEnabled?: boolean;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(50)
  @Type(() => Number)
  taxRate?: number;
}
