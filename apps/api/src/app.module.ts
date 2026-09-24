import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { clientIp } from './common/client-ip';
import { PrismaModule } from './prisma/prisma.module';
import { RoutesModule } from './routes/routes.module';
import { TripsModule } from './trips/trips.module';
import { BookingsModule } from './bookings/bookings.module';
import { AuthModule } from './auth/auth.module';
import { PaymentsModule } from './payments/payments.module';

import { AdminModule } from './admin/admin.module';
import { HealthModule } from './health/health.module';
import { SchedulesModule } from './schedules/schedules.module';
import { PricingModule } from './pricing/pricing.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),

    // Limite por IP. No hay guard global a proposito: solo lo usan los
    // endpoints que se pueden llamar sin sesion (reservar, entrar, registrarse)
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 600_000, limit: 10 }],
      getTracker: (req) => clientIp(req as never),
    }),
    PrismaModule,
    RoutesModule,
    TripsModule,
    BookingsModule,
    AuthModule,
    PaymentsModule,
    AdminModule,
    HealthModule,
    SchedulesModule,
    PricingModule,
  ],
})
export class AppModule {}
