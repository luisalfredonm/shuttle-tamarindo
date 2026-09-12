import { Test, TestingModule } from '@nestjs/testing';
import { ServiceUnavailableException } from '@nestjs/common';
import { HealthController } from './health.controller';
import { PrismaService } from '../prisma/prisma.service';

describe('HealthController', () => {
  let controller: HealthController;
  const queryRaw = jest.fn();

  beforeEach(async () => {
    queryRaw.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: PrismaService, useValue: { $queryRaw: queryRaw } }],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('responde ok cuando la base contesta', async () => {
    queryRaw.mockResolvedValue([{ 1: 1 }]);

    const result = await controller.check();

    expect(result.status).toBe('ok');
    expect(result.database).toBe('up');
    expect(typeof result.latencyMs).toBe('number');
  });

  // Lo importante no es el mensaje sino el 503: de eso depende que el
  // orquestador saque la instancia de rotacion en vez de servir errores
  it('lanza 503 cuando la base no contesta', async () => {
    queryRaw.mockRejectedValue(new Error('connection refused'));

    await expect(controller.check()).rejects.toThrow(
      ServiceUnavailableException,
    );
  });
});
