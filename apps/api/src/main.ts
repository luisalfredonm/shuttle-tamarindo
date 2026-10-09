import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  // rawBody: la firma del webhook de PayPal se calcula sobre el cuerpo tal
  // como llego. Si solo tuvieramos el JSON ya parseado y vuelto a serializar,
  // cualquier diferencia de formato invalidaria firmas legitimas.
  const app = await NestFactory.create(AppModule, { rawBody: true });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const corsOrigins = (
    process.env.CORS_ORIGINS ?? 'http://localhost:3000,http://localhost:3001'
  ).split(',');

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  // La API no es contenido para buscadores. Se usa el header y no un
  // robots.txt con Disallow: Googlebot pide /api/pricing y /api/routes al
  // renderizar las paginas, y bloquearlo le dejaria el sitio sin datos.
  app.use(
    (
      _req: unknown,
      res: { setHeader(k: string, v: string): void },
      next: () => void,
    ) => {
      res.setHeader('X-Robots-Tag', 'noindex, nofollow');
      next();
    },
  );

  app.setGlobalPrefix('api');

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`API corriendo en http://localhost:${port}/api`);
}

bootstrap();
