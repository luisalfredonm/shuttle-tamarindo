import { IsString, IsInt, IsNumber, IsOptional, IsBoolean, IsNotEmpty, Matches, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { NormalizeSlug, SLUG_PATTERN, Trim } from './slug';

export class CreateRouteDto {
  @NormalizeSlug()
  @IsString()
  @Matches(SLUG_PATTERN, {
    message: 'slug debe tener letras o numeros (ej: tamarindo-liberia-airport)',
  })
  slug: string;

  @Trim()
  @IsString()
  @IsNotEmpty()
  origin: string;

  @Trim()
  @IsString()
  @IsNotEmpty()
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
