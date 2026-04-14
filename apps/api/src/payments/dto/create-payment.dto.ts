import { IsString, IsOptional } from 'class-validator';

export class CreatePaymentDto {
  @IsString()
  bookingId: string;

  @IsOptional()
  @IsString()
  cardToken?: string; // cuando sea real, BAC envía este token
}
