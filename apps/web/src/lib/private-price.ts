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

/**
 * Impuesto encima de la tarifa. Misma cuenta que el API (pricing/tax.ts):
 * centavos redondeados una vez sobre el subtotal de la reserva.
 */
export function withTax(subtotal: number, pricing: PricingSettings) {
  const taxRate = pricing.taxEnabled ? pricing.taxRate : 0;
  const subtotalCents = Math.round(subtotal * 100);
  const taxCents = Math.round((subtotalCents * taxRate) / 100);
  return {
    subtotal: subtotalCents / 100,
    taxRate,
    taxAmount: taxCents / 100,
    total: (subtotalCents + taxCents) / 100,
  };
}

/** Formato de dinero: sin decimales si es entero ($60), con dos si no ($67.80) */
export function formatMoney(n: number) {
  return Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`;
}

/**
 * Filas de subtotal e impuesto de una reserva ya hecha. Vacío si no se cobró
 * impuesto (reservas anteriores o impuesto apagado): ahí basta el total.
 */
export function taxRows(booking: {
  subtotalAmount?: number | string;
  taxRate?: number | string;
  taxAmount?: number | string;
}) {
  const tax = Number(booking.taxAmount ?? 0);
  if (!tax) return [];
  return [
    { label: "Subtotal", value: formatMoney(Number(booking.subtotalAmount)) },
    { label: `Tax (IVA ${Number(booking.taxRate)}%)`, value: formatMoney(tax) },
  ];
}

/** Línea de las políticas sobre el IVA; null si el admin lo tiene apagado */
export function taxPolicyLine(pricing: PricingSettings) {
  return pricing.taxEnabled
    ? `Costa Rica sales tax (IVA, ${pricing.taxRate}%) is added to the rate and shown before you pay.`
    : null;
}

/** Números de from a to, ambos incluidos, para los selectores de pasajeros */
export function range(from: number, to: number) {
  return Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => from + i);
}
