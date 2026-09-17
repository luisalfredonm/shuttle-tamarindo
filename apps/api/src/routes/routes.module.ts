import { Module } from '@nestjs/common';
import { RoutesController } from './routes.controller';
import { RoutesService } from './routes.service';
import { RouteImagesService } from './route-images.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [RoutesController],
  providers: [RoutesService, RouteImagesService],
  exports: [RoutesService],
})
export class RoutesModule {}
