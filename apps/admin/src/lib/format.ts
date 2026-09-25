/** Formatos compartidos por las pantallas del panel */

export const money = (n: number | string | null | undefined) =>
  `$${Number(n ?? 0).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

export const time = (d: string | Date) =>
  new Date(d).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

export const shortDate = (d: string | Date) =>
  new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

/** "Today", "Tomorrow" o "Sat, Sep 26": así se lee una salida manejando */
export function dayLabel(d: string | Date) {
  const date = new Date(d);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  return shortDate(date);
}

export const isToday = (d: string | Date) => new Date(d).toDateString() === new Date().toDateString();

/** Código corto de la reserva, el que se le dicta al cliente por teléfono */
export const ref = (id: string) => id.slice(0, 8).toUpperCase();

export const titleCase = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

/** El tramo de ida representa la reserva cuando hay que mostrarla en una línea */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const outboundLeg = (b: any) => b?.legs?.find((l: any) => l.direction === "OUTBOUND") ?? b?.legs?.[0];

/** Color de ocupación: verde con lugar, ámbar pasado la mitad, rojo casi llena */
export const occupancyColor = (pct: number) => (pct > 80 ? "#c0392b" : pct > 50 ? "#d9822b" : "var(--brand-green)");

/** Clase de pill del kit para el estado de una reserva */
export const bookingPill = (status: string) =>
  ({ CONFIRMED: "pillGreen", PENDING: "pillAmber", CANCELLED: "pillRed", REFUNDED: "pillGray" } as const)[status] ?? "pillGray";

/** Clase de pill del kit para el estado de un viaje */
export const tripPill = (status: string) =>
  ({ SCHEDULED: "pillGreen", CONFIRMED: "pillBlue", CANCELLED: "pillRed", COMPLETED: "pillGray" } as const)[status] ?? "pillGray";

/** Teléfono solo con dígitos, para tel: y wa.me */
export const digits = (phone: string) => phone.replace(/[^\d]/g, "");
