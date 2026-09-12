import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

// Requiere una base alcanzable (DATABASE_URL): es un e2e, levanta AppModule real
describe('Health (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    // Mismo prefijo que main.ts, para que el test recorra las rutas reales
    app.setGlobalPrefix('api');
    await app.init();
  });

  it('/api/health (GET)', async () => {
    const res = await request(app.getHttpServer()).get('/api/health').expect(200);

    expect(res.body).toMatchObject({ status: 'ok', database: 'up' });
  });

  afterEach(async () => {
    await app.close();
  });
});
