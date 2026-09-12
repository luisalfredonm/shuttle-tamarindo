import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class GenerateTripsDto {
  /** Dias hacia adelante a mantener generados. Por defecto GENERATION_WINDOW_DAYS. */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  daysAhead?: number;

  /** Limitar la generacion a una sola ruta. Por defecto todas las activas. */
  @IsOptional()
  @IsUUID()
  routeId?: string;
}
