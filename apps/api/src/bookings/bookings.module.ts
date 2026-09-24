import { Module } from '@nestjs/common';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { TurnstileService } from './turnstile.service';
import { AuthModule } from '../auth/auth.module';
import { EmailModule } from '../email/email.module';
import { PricingModule } from '../pricing/pricing.module';

@Module({
  imports: [AuthModule, EmailModule, PricingModule],
  controllers: [BookingsController],
  providers: [BookingsService, TurnstileService],
  exports: [BookingsService],
})
export class BookingsModule {}
