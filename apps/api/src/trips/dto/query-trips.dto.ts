import { IsDateString, IsOptional, IsString } from 'class-validator';

export class QueryTripsDto {
  @IsOptional()
  @IsString()
  routeId?: string;

  @IsOptional()
  @IsString()
  routeSlug?: string;

  @IsOptional()
  @IsDateString()
  date?: string;
}
