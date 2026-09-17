import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { RoutesService } from './routes.service';
import {
  MAX_ROUTE_IMAGE_BYTES,
  RouteImagesService,
} from './route-images.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('routes')
export class RoutesController {
  constructor(
    private readonly routesService: RoutesService,
    private readonly routeImages: RouteImagesService,
  ) {}

  // Lectura pública: la web muestra las rutas sin sesión.
  // ?active=true deja fuera las rutas apagadas; sin el parámetro vienen todas,
  // que es lo que necesita el panel para poder reactivarlas.
  @Get()
  findAll(@Query('active') active?: string) {
    return this.routesService.findAll(active === 'true');
  }

  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.routesService.findBySlug(slug);
  }

  // A partir de acá, solo ADMIN
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post()
  create(@Body() dto: CreateRouteDto) {
    return this.routesService.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRouteDto) {
    return this.routesService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.routesService.remove(id);
  }

  // Foto propia de la ruta. Los guards corren antes que el interceptor, asi
  // que sin sesion de admin el archivo ni siquiera se lee
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post(':id/image')
  @UseInterceptors(
    FileInterceptor('image', {
      limits: { fileSize: MAX_ROUTE_IMAGE_BYTES, files: 1 },
    }),
  )
  uploadImage(
    @Param('id') id: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.routeImages.upload(id, file);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete(':id/image')
  removeImage(@Param('id') id: string) {
    return this.routeImages.remove(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('seed')
  seed() {
    return this.routesService.seed();
  }
}
