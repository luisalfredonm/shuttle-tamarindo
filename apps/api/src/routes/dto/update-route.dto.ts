import {
  IsString,
  IsInt,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsNotEmpty,
  Matches,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { NormalizeSlug, SLUG_PATTERN, Trim } from './slug';

export class UpdateRouteDto {
  // Editable para poder corregir un slug mal escrito; las reservas se enlazan por id
  @IsOptional()
  @NormalizeSlug()
  @IsString()
  @Matches(SLUG_PATTERN, {
    message: 'slug debe tener letras o numeros (ej: tamarindo-liberia-airport)',
  })
  slug?: string;

  @IsOptional()
  @Trim()
  @IsString()
  @IsNotEmpty()
  origin?: string;

  @IsOptional()
  @Trim()
  @IsString()
  @IsNotEmpty()
  destination?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationMin?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  distanceKm?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  pricePrivate?: number;

  /** null lo borra: la ruta y su inversa dejan de vender round trip privado */
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  pricePrivateRoundTrip?: number | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
