const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export interface Route {
  id: string;
  slug: string;
  origin: string;
  destination: string;
  durationMin: number;
  distanceKm: number;
  /** Precio fijo del privado en esta ruta: vehículo exclusivo, cualquier hora */
  pricePrivate: number;
  /** Privado ida y vuelta. null = esta ruta no vende round trip privado */
  pricePrivateRoundTrip?: number | null;
  /** Slug de la ruta con origen y destino invertidos, si está activa */
  reverseSlug?: string | null;
  isActive?: boolean;
  /** true si la ruta tiene horarios: se puede vender compartido, no solo privado */
  sharedEnabled?: boolean;
  /** Precio por asiento mas barato entre sus horarios. null si no hay compartido */
  priceShared?: number | null;
  /** Horas de salida del compartido, en hora local ("08:00") */
  departureTimes?: string[];
  /** Días en que sale el compartido (0 = domingo). Todos si sale a diario */
  sharedDays?: number[];
  /** Foto propia subida desde el panel (Vercel Blob). null si no tiene */
  imageUrl?: string | null;
}

export interface Trip {
  id: string;
  routeId: string;
  departureAt: string;
  capacity: number;
  bookedSeats: number;
  priceShared: number;
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
  /** Enlace secreto de la reserva: con esto se ve y se paga sin cuenta */
  accessToken?: string | null;
  /** true si se reservó sin sesión: solo se abre con su enlace */
  bookedAsGuest?: boolean;
  type: "SHARED" | "PRIVATE";
  tripType: "ONE_WAY" | "ROUND_TRIP";
  passengers: number;
  /** Infantes de 0 a 2 años: no pagan pero ocupan asiento */
  infants?: number;
  totalAmount: number;
  status: string;
  heldUntil: string;
  minutesToPay: number;
  notes?: string;
  flightNumber?: string;
  pickupAddress?: string;
  agreementSignedName?: string;
  agreementSignedAt?: string;
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

/** "3" o "3 + 1 infant": los infantes no pagan pero el conductor debe saberlo */
export function passengersLabel(booking: {
  passengers: number;
  infants?: number;
}) {
  const infants = booking.infants ?? 0;
  if (!infants) return `${booking.passengers}`;
  return `${booking.passengers} + ${infants} infant${infants === 1 ? "" : "s"}`;
}

/** El tramo de regreso; solo existe en ida y vuelta */
export function returnLeg(booking: any): any {
  return booking?.legs?.find((l: any) => l.direction === "RETURN");
}

/** Mensaje único para la sesión vencida, para que todas las pantallas digan lo mismo */
export const SESSION_EXPIRED =
  "Your session expired. Sign in again to finish your booking.";

/**
 * Cierra la sesión vencida y manda al login.
 *
 * El token dura 7 días y vence en silencio: sin esto, el visitante se queda en
 * el formulario lleno con un error que no explica nada y abandona la reserva.
 * Se guarda a dónde volver para que pueda retomarla donde la dejó.
 */
export function handleExpiredSession() {
  if (typeof window === "undefined") return;

  localStorage.removeItem("shuttle_token");
  localStorage.removeItem("shuttle_user");

  const back = window.location.pathname + window.location.search;
  window.location.href = `/login?expired=1&returnTo=${encodeURIComponent(back)}`;
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
    if (res.status === 401) {
      handleExpiredSession();
      throw new Error(SESSION_EXPIRED);
    }
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Request failed");
  }

  return res.json();
}

/**
 * fetch de una reserva concreta, con sesión o con su enlace secreto.
 *
 * Desde que se puede reservar sin cuenta, la misma pantalla sirve a dos
 * clientes: el que tiene sesión (Bearer) y el invitado, que llega con el
 * token de su reserva en la URL o en el correo. Se mandan los dos cuando
 * existen y el servidor acepta el que le sirva.
 */
export async function bookingFetch(
  path: string,
  bookingToken?: string,
  options?: RequestInit,
) {
  const session = localStorage.getItem("shuttle_token");
  if (!session && !bookingToken) {
    throw new Error("You must be signed in");
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(session ? { Authorization: `Bearer ${session}` } : {}),
      ...(bookingToken ? { "X-Booking-Token": bookingToken } : {}),
      ...options?.headers,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    // Con enlace secreto un 401 no es una sesión vencida: es que el enlace no
    // sirve, y mandar al login dejaría al invitado sin salida
    if (res.status === 401 && !bookingToken) {
      handleExpiredSession();
      throw new Error(SESSION_EXPIRED);
    }
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Request failed");
  }

  return res.json();
}

/**
 * "Encuentra mi reserva": pide que manden los enlaces a ese correo.
 *
 * La respuesta es siempre la misma exista o no el correo, así que esta
 * pantalla no sirve para averiguar quién compró.
 */
export async function lookupBookings(
  email: string,
  turnstileToken?: string,
): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/bookings/lookup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, turnstileToken }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err.message ||
        "We could not send the email right now. Please try again in a minute.",
    );
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

/** Un metodo de pago prendido en el panel y con credenciales en el servidor */
export interface PaymentMethod {
  provider: "PAYPAL" | "BAC_CREDOMATIC";
  /** "sandbox" mientras se prueba: en el checkout se avisa que no se cobra */
  mode: string;
  /** clientId del SDK. Es publico por diseno: viaja al navegador */
  publicKey: string | null;
}

/**
 * Metodos disponibles para el checkout.
 *
 * Si la API no responde devuelve una lista vacia en vez de romper: el checkout
 * muestra que el pago en linea no esta disponible, que es informacion util, en
 * lugar de una pantalla en blanco sobre una reserva que ya tiene asientos.
 */
export async function getPaymentMethods(): Promise<PaymentMethod[]> {
  try {
    const res = await fetch(`${API_URL}/payments/methods`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

/** Reglas del privado, iguales para todas las rutas. Se editan en el panel. */
export interface PricingSettings {
  includedPassengers: number;
  extraPassengerPrice: number;
  vehicleCapacity: number;
}

/** Valores de la migración: se usan solo si la API no responde */
export const DEFAULT_PRICING: PricingSettings = {
  includedPassengers: 4,
  extraPassengerPrice: 20,
  vehicleCapacity: 10,
};

/**
 * Reglas vigentes para mostrar el desglose. Si la API falla se muestran las
 * de fábrica en vez de romper el buscador: el total real lo calcula el
 * servidor al reservar.
 */
export async function getPricing(): Promise<PricingSettings> {
  try {
    const res = await fetch(`${API_URL}/pricing`, { cache: "no-store" });
    if (!res.ok) return DEFAULT_PRICING;
    return await res.json();
  } catch {
    return DEFAULT_PRICING;
  }
}

/**
 * Reglas del privado para páginas del servidor (la home). Se revalidan cada
 * 5 minutos como las rutas, para que la página siga siendo estática.
 */
export async function getPricingCached(): Promise<PricingSettings> {
  try {
    const res = await fetch(`${API_URL}/pricing`, { next: { revalidate: 300 } });
    if (!res.ok) return DEFAULT_PRICING;
    return await res.json();
  } catch {
    return DEFAULT_PRICING;
  }
}

export async function getRoutes(): Promise<Route[]> {
  const res = await fetch(`${API_URL}/routes`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch routes");
  return res.json();
}

/**
 * Rutas activas para el buscador, desde el servidor.
 *
 * Se revalida cada 5 minutos en vez de pedirlas en cada visita: la home sigue
 * siendo estática (que es de lo que vive el SEO) y una ruta nueva del panel
 * aparece sola en ese plazo. Si la API no responde devuelve una lista vacía en
 * lugar de tirar la home abajo: el buscador avisa y el resto del sitio sigue en
 * pie, que es preferible a una landing caída.
 */
export async function getActiveRoutes(): Promise<Route[]> {
  try {
    const res = await fetch(`${API_URL}/routes?active=true`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function getRouteBySlug(slug: string): Promise<Route> {
  const res = await fetch(`${API_URL}/routes/${encodeURIComponent(slug)}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch route");
  return res.json();
}

export async function createBooking(data: {
  /** SHARED: la salida elegida de la lista */
  tripId?: string;
  returnTripId?: string;
  /** PRIVATE: ruta + hora libre elegida por el cliente */
  routeSlug?: string;
  departureAt?: string;
  returnRouteSlug?: string;
  returnDepartureAt?: string;
  type: "SHARED" | "PRIVATE";
  passengers: number;
  infants?: number;
  notes?: string;
  flightNumber?: string;
  pickupAddress?: string;
  agreementSignedName: string;
  /** Contacto de quien reserva sin cuenta. Con sesión no se envían. */
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  turnstileToken?: string;
}): Promise<Booking> {
  // El userId ya no se envía: el backend lo toma del JWT. Sin sesión se
  // reserva igual (checkout de invitado) y la reserva viaja con su enlace.
  const token = localStorage.getItem("shuttle_token");

  const res = await fetch(`${API_URL}/bookings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    // Reservar es el paso que más duele perder: si la sesión venció, se avisa
    // y se vuelve acá después de entrar, en vez de dejar un error suelto.
    if (res.status === 401 && token) {
      handleExpiredSession();
      throw new Error(SESSION_EXPIRED);
    }
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Booking failed");
  }
  return res.json();
}
