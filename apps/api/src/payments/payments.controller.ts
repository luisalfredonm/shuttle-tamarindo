import {
  Controller,
  Post,
  Patch,
  Get,
  Body,
  Param,
  Headers,
  Req,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentConfigService } from './payment-config.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CaptureOrderDto } from './dto/capture-order.dto';
import { UpdatePaymentConfigDto } from './dto/update-payment-config.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly configService: PaymentConfigService,
  ) {}

  /**
   * Metodos disponibles para el checkout.
   *
   * Publico y sin secretos: solo dice que pasarelas estan prendidas y el
   * identificador publico que el SDK necesita en el navegador.
   */
  @Get('methods')
  methods() {
    return this.paymentsService.availableMethods();
  }

  /**
   * Aviso de la pasarela. Publico por definicion: lo llama PayPal, no el
   * cliente. La firma se verifica en el servicio contra la API de PayPal.
   */
  @Post('webhook/paypal')
  webhook(@Headers() headers: Record<string, unknown>, @Req() req: any) {
    // rawBody: el cuerpo sin parsear, que es sobre lo que se calcula la firma
    const raw = req.rawBody?.toString('utf8') ?? JSON.stringify(req.body ?? {});
    return this.paymentsService.handleWebhook(headers, raw);
  }

  // Pagar no exige cuenta: vale la sesion del dueno o el enlace secreto de la
  // reserva (X-Booking-Token). Quien puede pagar cual reserva lo decide el
  // servicio, no este controlador.
  @UseGuards(OptionalJwtAuthGuard)
  @Post('order')
  createOrder(
    @Request() req: any,
    @Body() dto: CreateOrderDto,
    @Headers('x-booking-token') token?: string,
  ) {
    return this.paymentsService.createOrder(
      dto.reservationId,
      req.user ?? undefined,
      token,
    );
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Post('capture')
  capture(
    @Request() req: any,
    @Body() dto: CaptureOrderDto,
    @Headers('x-booking-token') token?: string,
  ) {
    return this.paymentsService.captureOrder(
      dto.orderId,
      req.user ?? undefined,
      token,
    );
  }

  // Configuracion de metodos: solo ADMIN. Nunca devuelve ni acepta secretos.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('config')
  listConfig() {
    return this.configService.list();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch('config/:provider')
  updateConfig(
    @Param('provider') provider: string,
    @Body() dto: UpdatePaymentConfigDto,
  ) {
    return this.configService.update(provider, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('config/:provider/verify')
  verifyConfig(@Param('provider') provider: string) {
    return this.configService.verify(provider);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get('booking/:bookingId')
  getByBooking(
    @Request() req: any,
    @Param('bookingId') bookingId: string,
    @Headers('x-booking-token') token?: string,
  ) {
    return this.paymentsService.getPaymentByBooking(
      bookingId,
      req.user ?? undefined,
      token,
    );
  }
}
