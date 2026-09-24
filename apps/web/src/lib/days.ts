/** Días como los devuelve la API: 0 = domingo ... 6 = sábado, hora de Costa Rica */
const LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
// Lunes primero, que es como se lee la semana
const WEEK = [1, 2, 3, 4, 5, 6, 0];

/** Sin dato se asume todos los días: así funcionaban los horarios antes */
export function isEveryDay(days?: number[] | null) {
  return !days || days.length === 0 || days.length === 7;
}

/** "Saturdays", "Saturdays and Sundays", "Mon, Wed & Fri" */
export function daysPhrase(days: number[]) {
  const ordered = WEEK.filter((d) => days.includes(d));
  if (ordered.length <= 2) return ordered.map((d) => `${LONG[d]}s`).join(" and ");

  const names = ordered.map((d) => SHORT[d]);
  return `${names.slice(0, -1).join(", ")} & ${names[names.length - 1]}`;
}

/** "Daily departures at 8:00 AM" o "Departures on Saturdays at 8:00 AM" */
export function sharedScheduleText(days: number[] | undefined | null, hours: string[]) {
  const at = hours.length ? ` at ${hours.join(", ")}` : "";
  return isEveryDay(days) ? `Daily departures${at}` : `Departures on ${daysPhrase(days!)}${at}`;
}
