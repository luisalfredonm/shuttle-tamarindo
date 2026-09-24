/**
 * Conversion entre la hora local de un horario y el instante UTC de una salida.
 *
 * Costa Rica es UTC-6 todo el año: no tiene horario de verano, asi que el
 * offset es una constante y no hace falta una libreria de zonas horarias.
 * Si algun dia se opera fuera de CR, esto es lo unico que hay que cambiar.
 */
export const CR_UTC_OFFSET_HOURS = 6;

/** "HH:MM" de 24 horas, de 00:00 a 23:59 */
export const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isValidTime(time: string): boolean {
  return TIME_PATTERN.test(time);
}

export function parseTime(time: string): { hour: number; minute: number } {
  const match = TIME_PATTERN.exec(time);
  if (!match) {
    throw new Error(`Hora invalida: "${time}". Se espera HH:MM de 24 horas.`);
  }
  return { hour: Number(match[1]), minute: Number(match[2]) };
}

/**
 * Instante UTC de una salida, dado el dia (en hora de CR) y la hora local.
 *
 * Se construye con Date.UTC y se le suma el offset en vez de usar setHours,
 * para que el resultado no dependa de la zona horaria del servidor: la misma
 * entrada da el mismo instante corriendo en Costa Rica o en Railway.
 */
export function toUtcDeparture(
  year: number,
  month: number,
  day: number,
  time: string,
): Date {
  const { hour, minute } = parseTime(time);
  return new Date(
    Date.UTC(year, month - 1, day, hour + CR_UTC_OFFSET_HOURS, minute, 0, 0),
  );
}

/** Todos los dias: 0 = domingo ... 6 = sabado, como Date.getUTCDay */
export const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

/** Dia de la semana de un instante, en hora de Costa Rica */
export function costaRicaWeekday(date: Date): number {
  return new Date(
    date.getTime() - CR_UTC_OFFSET_HOURS * 3600 * 1000,
  ).getUTCDay();
}

/** Partes de la fecha en hora de Costa Rica de un instante UTC */
export function toCostaRicaParts(date: Date): {
  year: number;
  month: number;
  day: number;
  time: string;
} {
  const local = new Date(date.getTime() - CR_UTC_OFFSET_HOURS * 3600 * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    year: local.getUTCFullYear(),
    month: local.getUTCMonth() + 1,
    day: local.getUTCDate(),
    time: `${pad(local.getUTCHours())}:${pad(local.getUTCMinutes())}`,
  };
}
