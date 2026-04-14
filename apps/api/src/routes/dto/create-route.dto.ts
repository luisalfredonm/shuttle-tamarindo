import { IsString, IsInt, IsOptional, IsBoolean, Min } from 'class-validator';

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

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
