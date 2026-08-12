import { IsString, IsInt, IsNumber, IsOptional, IsBoolean, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRouteDto {
  @IsString()
  slug: string;

  @IsString()
  origin: string;

  @IsString()
  destination: string;

  @IsInt()
  @Min(1)
  durationMin: number;

  @IsInt()
  @Min(1)
  distanceKm: number;

  /** Precio fijo del transfer privado en esta ruta (vehículo exclusivo, cualquier hora) */
  @IsNumber()
  @Type(() => Number)
  pricePrivate: number;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
