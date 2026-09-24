import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { PricingService } from './pricing.service';
import { UpdatePricingDto } from './dto/update-pricing.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('pricing')
export class PricingController {
  constructor(private readonly pricing: PricingService) {}

  // Publico: la web lo necesita para mostrar el desglose antes de reservar
  @Get()
  get() {
    return this.pricing.get();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch()
  update(@Body() dto: UpdatePricingDto) {
    return this.pricing.update(dto);
  }
}
