export type AdminRoute = {
  id: string;
  slug: string;
  origin: string;
  destination: string;
  durationMin: number;
  distanceKm: number;
  pricePrivate: number;
  pricePrivateRoundTrip: number | null;
  isActive: boolean;
  imageUrl: string | null;
};

export const emptyRouteForm = {
  slug: "",
  origin: "",
  destination: "",
  durationMin: "",
  distanceKm: "",
  pricePrivate: "",
  pricePrivateRoundTrip: "",
};

export type RouteForm = typeof emptyRouteForm;
