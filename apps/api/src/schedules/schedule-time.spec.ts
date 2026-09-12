import {
  isValidTime,
  parseTime,
  toCostaRicaParts,
  toUtcDeparture,
} from './schedule-time';

describe('schedule-time', () => {
  describe('isValidTime', () => {
    it('acepta horas validas de 24h', () => {
      for (const time of ['00:00', '08:00', '09:30', '14:00', '23:59']) {
        expect(isValidTime(time)).toBe(true);
      }
    });

    it('rechaza lo que no es HH:MM de 24h', () => {
      for (const time of ['24:00', '8:00', '08:60', '0800', '8am', '', '08:0']) {
        expect(isValidTime(time)).toBe(false);
      }
    });
  });

  describe('toUtcDeparture', () => {
    // El bug que dejo 540 salidas a las 3 de la madrugada fue guardar la hora
    // local como si fuera UTC. 08:00 en Costa Rica son las 14:00 UTC.
    it('convierte la hora local de Costa Rica a UTC sumando 6 horas', () => {
      expect(toUtcDeparture(2026, 9, 15, '08:00').toISOString()).toBe(
        '2026-09-15T14:00:00.000Z',
      );
      expect(toUtcDeparture(2026, 9, 15, '12:00').toISOString()).toBe(
        '2026-09-15T18:00:00.000Z',
      );
      expect(toUtcDeparture(2026, 9, 15, '14:00').toISOString()).toBe(
        '2026-09-15T20:00:00.000Z',
      );
    });

    it('pasa al dia siguiente en UTC cuando la hora local es de noche', () => {
      // 20:00 del 15 en CR son las 02:00 del 16 en UTC
      expect(toUtcDeparture(2026, 9, 15, '20:00').toISOString()).toBe(
        '2026-09-16T02:00:00.000Z',
      );
    });

    it('respeta los minutos', () => {
      expect(toUtcDeparture(2026, 9, 15, '09:30').toISOString()).toBe(
        '2026-09-15T15:30:00.000Z',
      );
    });

    // Costa Rica no tiene horario de verano: la misma hora local da el mismo
    // offset en enero y en julio. Si algun dia deja de ser cierto, esto falla.
    it('usa el mismo offset en invierno y en verano', () => {
      expect(toUtcDeparture(2026, 1, 15, '08:00').toISOString()).toBe(
        '2026-01-15T14:00:00.000Z',
      );
      expect(toUtcDeparture(2026, 7, 15, '08:00').toISOString()).toBe(
        '2026-07-15T14:00:00.000Z',
      );
    });

    it('falla con una hora mal formada en vez de inventar una salida', () => {
      expect(() => toUtcDeparture(2026, 9, 15, '25:00')).toThrow();
    });
  });

  describe('toCostaRicaParts', () => {
    it('vuelve a la hora local desde UTC', () => {
      const parts = toCostaRicaParts(new Date('2026-09-15T14:00:00.000Z'));
      expect(parts).toEqual({ year: 2026, month: 9, day: 15, time: '08:00' });
    });

    it('retrocede un dia cuando en UTC ya es de madrugada', () => {
      const parts = toCostaRicaParts(new Date('2026-09-16T02:00:00.000Z'));
      expect(parts).toEqual({ year: 2026, month: 9, day: 15, time: '20:00' });
    });

    it('es la inversa exacta de toUtcDeparture', () => {
      for (const time of ['00:00', '08:00', '12:00', '14:00', '23:59']) {
        const utc = toUtcDeparture(2026, 9, 15, time);
        expect(toCostaRicaParts(utc).time).toBe(time);
      }
    });
  });

  describe('parseTime', () => {
    it('separa hora y minuto', () => {
      expect(parseTime('09:30')).toEqual({ hour: 9, minute: 30 });
      expect(parseTime('00:00')).toEqual({ hour: 0, minute: 0 });
    });

    it('lanza con formato invalido', () => {
      expect(() => parseTime('9:30')).toThrow(/Hora invalida/);
    });
  });
});
