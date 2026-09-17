import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { del, put } from '@vercel/blob';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Tope de la foto ya comprimida. El panel la achica antes de subirla y el
 * proxy del panel corre en Vercel, que corta los cuerpos arriba de 4.5 MB.
 */
export const MAX_ROUTE_IMAGE_BYTES = 4 * 1024 * 1024;

const EXTENSION_BY_TYPE = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
} as const;

type ImageType = keyof typeof EXTENSION_BY_TYPE;

/**
 * Tipo real del archivo segun sus primeros bytes.
 *
 * No alcanza con el mimetype que manda el navegador: lo decide el cliente y se
 * puede falsear. Con esto solo entran JPEG, PNG y WebP de verdad.
 */
function detectImageType(buffer: Buffer): ImageType | null {
  if (buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    buffer
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return 'image/png';
  }
  if (
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'image/webp';
  }
  return null;
}

/** Solo se borran fotos que subimos nosotros, nunca una URL externa */
function isOwnBlob(url: string | null): url is string {
  if (!url) return false;
  try {
    return new URL(url).hostname.endsWith('.blob.vercel-storage.com');
  } catch {
    return false;
  }
}

@Injectable()
export class RouteImagesService {
  private readonly logger = new Logger(RouteImagesService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  private get token() {
    const token = this.config.get<string>('BLOB_READ_WRITE_TOKEN');
    if (!token) {
      throw new ServiceUnavailableException(
        'La subida de fotos no esta configurada (falta BLOB_READ_WRITE_TOKEN)',
      );
    }
    return token;
  }

  async upload(routeId: string, file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('Falta la foto');

    const type = detectImageType(file.buffer);
    if (!type) {
      throw new BadRequestException('La foto debe ser JPG, PNG o WebP');
    }

    const route = await this.prisma.route.findUnique({
      where: { id: routeId },
    });
    if (!route) throw new NotFoundException('Ruta no encontrada');

    // Nombre unico por subida: la web cachea las imagenes por URL, asi que
    // reemplazar el mismo archivo tardaria horas en verse
    const blob = await put(
      `routes/${route.slug}.${EXTENSION_BY_TYPE[type]}`,
      file.buffer,
      {
        access: 'public',
        contentType: type,
        addRandomSuffix: true,
        token: this.token,
      },
    );

    const updated = await this.prisma.route.update({
      where: { id: routeId },
      data: { imageUrl: blob.url },
    });

    await this.deleteBlob(route.imageUrl);
    return updated;
  }

  async remove(routeId: string) {
    const route = await this.prisma.route.findUnique({
      where: { id: routeId },
    });
    if (!route) throw new NotFoundException('Ruta no encontrada');

    const updated = await this.prisma.route.update({
      where: { id: routeId },
      data: { imageUrl: null },
    });

    await this.deleteBlob(route.imageUrl);
    return updated;
  }

  /** Limpieza de la foto anterior: si falla solo queda un archivo huerfano */
  async deleteBlob(url: string | null) {
    if (!isOwnBlob(url)) return;
    try {
      await del(url, { token: this.token });
    } catch (err) {
      this.logger.warn(`No se pudo borrar la foto anterior ${url}: ${err}`);
    }
  }
}
