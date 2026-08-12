/**
 * Los tramos de una reserva, uno por salida.
 *
 * En ida y vuelta hay dos vehículos en dos fechas distintas: mostrar solo el
 * de ida deja al cliente viendo un total que no cuadra con lo que ve.
 */

interface Leg {
  direction: "OUTBOUND" | "RETURN";
  passengers: number;
  amount: number;
  trip: {
    departureAt: string;
    route: { origin: string; destination: string };
  };
}

const LABELS: Record<Leg["direction"], string> = {
  OUTBOUND: "Outbound",
  RETURN: "Return",
};

export default function BookingLegs({
  legs,
  showAmount = true,
}: {
  legs: Leg[];
  showAmount?: boolean;
}) {
  if (!legs?.length) return null;

  // Con un solo tramo la etiqueta "Outbound" no aporta nada
  const multiLeg = legs.length > 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {legs.map((leg) => {
        const dep = new Date(leg.trip.departureAt);
        return (
          <div
            key={leg.direction}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "1rem",
              padding: "0.9rem 1rem",
              background: "#faf8f4",
              border: "1px solid #ece7dd",
              borderRadius: "12px",
            }}
          >
            <div style={{ minWidth: 0 }}>
              {multiLeg && (
                <div
                  style={{
                    fontSize: "0.66rem",
                    color: "var(--brand-gold)",
                    fontFamily: "DM Sans, sans-serif",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    fontWeight: 500,
                    marginBottom: "3px",
                  }}
                >
                  {LABELS[leg.direction]}
                </div>
              )}
              <div
                style={{
                  fontFamily: "DM Sans, sans-serif",
                  fontWeight: 500,
                  fontSize: "0.92rem",
                  color: "var(--brand-dark)",
                  lineHeight: 1.4,
                }}
              >
                {leg.trip.route.origin} → {leg.trip.route.destination}
              </div>
              <div
                style={{
                  fontFamily: "DM Sans, sans-serif",
                  fontSize: "0.82rem",
                  color: "var(--brand-gray)",
                  marginTop: "2px",
                }}
              >
                {dep.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
                {" · "}
                {dep.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })}
              </div>
            </div>

            {showAmount && (
              <div
                style={{
                  fontFamily: "Playfair Display, serif",
                  fontWeight: 600,
                  fontSize: "1.05rem",
                  color: "var(--brand-green)",
                  whiteSpace: "nowrap",
                }}
              >
                ${leg.amount}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
