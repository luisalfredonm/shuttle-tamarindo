const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export interface Route {
  id: string;
  slug: string;
  origin: string;
  destination: string;
  durationMin: number;
  distanceKm: number;
}

export interface Trip {
  id: string;
  routeId: string;
  departureAt: string;
  capacity: number;
  bookedSeats: number;
  priceShared: number;
  pricePrivate: number;
  status: string;
  availableSeats: number;
  isFull: boolean;
  occupancyPercent: number;
  /** Asientos ya pagados. Distinto de bookedSeats, que incluye holds. */
  confirmedSeats: number;
  sharedMinPassengers: number;
  /** true cuando un pasajero suelto ya puede sumarse a esta salida */
  sharedOpen: boolean;
  route: Route;
}

/** Un tramo de la reserva: una salida concreta */
export interface BookingLeg {
  id: string;
  tripId: string;
  direction: "OUTBOUND" | "RETURN";
  passengers: number;
  amount: number;
  trip: Trip;
}

/**
 * Lo que el cliente llama "su reserva". Agrupa 1 tramo (ida) o 2 (ida y
 * vuelta) y concentra el importe, porque el cobro es uno solo.
 */
export interface Booking {
  id: string;
  userId: string;
  type: "SHARED" | "PRIVATE";
  tripType: "ONE_WAY" | "ROUND_TRIP";
  passengers: number;
  totalAmount: number;
  status: string;
  heldUntil: string;
  minutesToPay: number;
  legs: BookingLeg[];
}

/**
 * El tramo de ida. Define la fecha y la ruta que representan a la reserva
 * cuando hay que mostrarla en una sola línea.
 */
export function outboundLeg(booking: any): any {
  return (
    booking?.legs?.find((l: any) => l.direction === "OUTBOUND") ??
    booking?.legs?.[0]
  );
}

/** El viaje de ida, o undefined si la reserva viniera sin tramos */
export function outboundTrip(booking: any): any {
  return outboundLeg(booking)?.trip;
}

/** El tramo de regreso; solo existe en ida y vuelta */
export function returnLeg(booking: any): any {
  return booking?.legs?.find((l: any) => l.direction === "RETURN");
}

/**
 * fetch con el JWT del usuario. Los endpoints de reservas y pagos exigen
 * sesión y solo devuelven lo que le pertenece a quien consulta.
 */
export async function authFetch(path: string, options?: RequestInit) {
  const token = localStorage.getItem("shuttle_token");
  if (!token) throw new Error("You must be signed in");

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Request failed");
  }

  return res.json();
}

export async function getTrips(params: {
  routeSlug?: string;
  date?: string;
}): Promise<Trip[]> {
  const query = new URLSearchParams();
  if (params.routeSlug) query.set("routeSlug", params.routeSlug);
  if (params.date) query.set("date", params.date);

  const res = await fetch(`${API_URL}/trips?${query}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch trips");
  return res.json();
}

export async function getRoutes(): Promise<Route[]> {
  const res = await fetch(`${API_URL}/routes`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch routes");
  return res.json();
}

export async function createBooking(data: {
  tripId: string;
  /** Solo en ida y vuelta: la salida del regreso */
  returnTripId?: string;
  type: "SHARED" | "PRIVATE";
  passengers: number;
}): Promise<Booking> {
  // El userId ya no se envía: el backend lo toma del JWT
  const token = localStorage.getItem("shuttle_token");
  if (!token) throw new Error("You must be signed in to book a trip");

  const res = await fetch(`${API_URL}/bookings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Booking failed");
  }
  return res.json();
}
