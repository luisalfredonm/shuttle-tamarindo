export interface PrivatePricingRules {
  includedPassengers: number;
  extraPassengerPrice: number;
}

/**
 * Total de un privado: el precio base cubre hasta includedPassengers y cada
 * pasajero que paga por encima suma extraPassengerPrice.
 *
 * En ida y vuelta la base es el precio round trip y los extras se cobran una
 * sola vez, no por tramo: por eso se calcula sobre la reserva y no por tramo.
 * Los infantes no entran aca porque no pagan.
 */
export function privateTotal(
  base: number,
  payingPassengers: number,
  rules: PrivatePricingRules,
) {
  const extraPassengers = Math.max(
    0,
    payingPassengers - rules.includedPassengers,
  );
  const extrasAmount = extraPassengers * rules.extraPassengerPrice;

  return { base, extraPassengers, extrasAmount, total: base + extrasAmount };
}

/**
 * Reparte un total entre dos tramos, en centavos para no perder uno.
 *
 * El cobro es uno solo por reserva; el importe por tramo es informativo, pero
 * tiene que sumar exactamente el total.
 */
export function splitInTwo(total: number): [number, number] {
  const cents = Math.round(total * 100);
  const first = Math.ceil(cents / 2);
  return [first / 100, (cents - first) / 100];
}
