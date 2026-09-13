import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PayPalProvider } from './providers/paypal.provider';
import { PaymentConfigService } from './payment-config.service';
import { EmailModule } from '../email/email.module';
import { AdminModule } from '../admin/admin.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [EmailModule, AdminModule, AuthModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymentConfigService, PayPalProvider],
  exports: [PaymentsService],
})
export class PaymentsModule {}
