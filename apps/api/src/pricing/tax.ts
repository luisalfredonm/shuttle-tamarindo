export interface TaxRules {
  taxEnabled: boolean;
  /** Porcentaje, ej. 13 = 13% */
  taxRate: number;
}

/**
 * Suma el impuesto encima de la tarifa. Se redondea a centavos una sola vez,
 * sobre el subtotal de la reserva y no por tramo, para que el total cuadre
 * con lo que se le muestra al cliente.
 */
export function applyTax(subtotal: number, rules: TaxRules) {
  const taxRate = rules.taxEnabled ? rules.taxRate : 0;
  const subtotalCents = Math.round(subtotal * 100);
  const taxCents = Math.round((subtotalCents * taxRate) / 100);

  return {
    subtotal: subtotalCents / 100,
    taxRate,
    taxAmount: taxCents / 100,
    total: (subtotalCents + taxCents) / 100,
  };
}
