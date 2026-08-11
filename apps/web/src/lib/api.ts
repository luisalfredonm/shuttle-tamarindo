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
  route: Route;
}

export interface Booking {
  id: string;
  tripId: string;
  userId: string;
  type: "SHARED" | "PRIVATE";
  passengers: number;
  totalAmount: number;
  status: string;
  heldUntil: string;
  minutesToPay: number;
  trip: Trip;
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
