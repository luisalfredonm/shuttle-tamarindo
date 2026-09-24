import { IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';
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
}
