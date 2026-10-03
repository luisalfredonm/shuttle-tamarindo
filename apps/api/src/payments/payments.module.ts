import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PayPalProvider } from './providers/paypal.provider';
import { PaymentConfigService } from './payment-config.service';
import { AuthModule } from '../auth/auth.module';
import { BookingsModule } from '../bookings/bookings.module';

@Module({
  imports: [AuthModule, BookingsModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymentConfigService, PayPalProvider],
  exports: [PaymentsService],
})
export class PaymentsModule {}
