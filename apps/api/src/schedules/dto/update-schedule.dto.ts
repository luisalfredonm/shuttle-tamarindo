import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TIME_PATTERN } from '../schedule-time';

export class UpdateScheduleDto {
  @IsOptional()
  @IsString()
  @Matches(TIME_PATTERN, {
    message: 'departureTime debe ser HH:MM en 24 horas, hora de Costa Rica',
  })
  departureTime?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  priceShared?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(60)
  capacity?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
