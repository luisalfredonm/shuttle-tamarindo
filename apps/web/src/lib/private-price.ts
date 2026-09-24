import type { PricingSettings } from "./api";

/**
 * Total de un privado. Misma fórmula que el API (apps/api/src/pricing):
 * la base cubre includedPassengers y cada pasajero que paga por encima suma
 * extraPassengerPrice, una sola vez aunque sea ida y vuelta. Los infantes no
 * pagan, así que no entran.
 */
export function privateQuote(
  base: number,
  payingPassengers: number,
  pricing: PricingSettings,
) {
  const extraPassengers = Math.max(
    0,
    payingPassengers - pricing.includedPassengers,
  );
  const extrasAmount = extraPassengers * pricing.extraPassengerPrice;

  return { base, extraPassengers, extrasAmount, total: base + extrasAmount };
}

/** Números de from a to, ambos incluidos, para los selectores de pasajeros */
export function range(from: number, to: number) {
  return Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => from + i);
}
