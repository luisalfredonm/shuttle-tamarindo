import { Module } from '@nestjs/common';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { TurnstileService } from './turnstile.service';
import { BookingNotifier } from './booking-notifier.service';
import { AuthModule } from '../auth/auth.module';
import { AdminModule } from '../admin/admin.module';
import { EmailModule } from '../email/email.module';
import { PricingModule } from '../pricing/pricing.module';

@Module({
  imports: [AuthModule, AdminModule, EmailModule, PricingModule],
  controllers: [BookingsController],
  providers: [BookingsService, TurnstileService, BookingNotifier],
  exports: [BookingsService, BookingNotifier],
})
export class BookingsModule {}
