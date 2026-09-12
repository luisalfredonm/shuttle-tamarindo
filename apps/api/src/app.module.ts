import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { RoutesModule } from './routes/routes.module';
import { TripsModule } from './trips/trips.module';
import { BookingsModule } from './bookings/bookings.module';
import { AuthModule } from './auth/auth.module';
import { PaymentsModule } from './payments/payments.module';

import { AdminModule } from './admin/admin.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    RoutesModule,
    TripsModule,
    BookingsModule,
    AuthModule,
    PaymentsModule,
    AdminModule,
    HealthModule,
  ],
})
export class AppModule {}
