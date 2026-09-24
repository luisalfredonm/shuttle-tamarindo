import { Injectable } from '@nestjs/common';
import { Prisma } from '@shuttle/database';
import { PrismaService } from '../prisma/prisma.service';
import { UpdatePricingDto } from './dto/update-pricing.dto';

const SETTINGS_ID = 1;

export interface PricingSettingsView {
  includedPassengers: number;
  extraPassengerPrice: number;
  vehicleCapacity: number;
}

@Injectable()
export class PricingService {
  constructor(private prisma: PrismaService) {}

  /**
   * Reglas vigentes. La migracion siembra la fila, pero se crea si faltara:
   * una base sin ella no debe dejar de vender.
   */
  async get(
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<PricingSettingsView> {
    const settings = await tx.pricingSettings.upsert({
      where: { id: SETTINGS_ID },
      create: { id: SETTINGS_ID },
      update: {},
    });

    return {
      includedPassengers: settings.includedPassengers,
      extraPassengerPrice: Number(settings.extraPassengerPrice),
      vehicleCapacity: settings.vehicleCapacity,
    };
  }

  async update(dto: UpdatePricingDto): Promise<PricingSettingsView> {
    await this.prisma.pricingSettings.upsert({
      where: { id: SETTINGS_ID },
      create: { id: SETTINGS_ID, ...dto },
      update: dto,
    });
    return this.get();
  }
}
