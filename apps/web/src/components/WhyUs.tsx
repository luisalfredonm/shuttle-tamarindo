const FEATURES = [
  {
    icon: "✓",
    title: "Guaranteed Departures",
    desc: "Your trip runs no matter what. No minimum passengers required — ever.",
  },
  {
    icon: "⏱",
    title: "Always On Time",
    desc: "Professional drivers tracking your flight. We wait for you.",
  },
  {
    icon: "$",
    title: "Transparent Pricing",
    desc: "No hidden fees. The price you see is the price you pay.",
  },
  {
    icon: "❄",
    title: "Air Conditioned",
    desc: "Modern, comfortable vehicles with A/C for every journey.",
  },
];

export default function WhyUs() {
  return (
    <section
      id="how-it-works"
      style={{
        background: "var(--brand-dark)",
        padding: "5rem 2rem",
      }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <h2
          style={{
            textAlign: "center",
            fontSize: "2.2rem",
            color: "#fff",
            marginBottom: "0.5rem",
          }}
        >
          Why Choose Us
        </h2>
        <p
          style={{
            textAlign: "center",
            color: "rgba(255,255,255,0.5)",
            marginBottom: "3.5rem",
            fontFamily: "DM Sans, sans-serif",
          }}
        >
          The most reliable shuttle service in Guanacaste
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {FEATURES.map((f) => (
            <div
              key={f.title}
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "16px",
                padding: "2rem",
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "10px",
                  background: "rgba(201,151,58,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.1rem",
                  color: "var(--brand-gold)",
                  marginBottom: "1.25rem",
                }}
              >
                {f.icon}
              </div>
              <h3
                style={{
                  color: "#fff",
                  fontSize: "1.05rem",
                  marginBottom: "0.5rem",
                  fontFamily: "DM Sans, sans-serif",
                  fontWeight: 500,
                }}
              >
                {f.title}
              </h3>
              <p
                style={{
                  color: "rgba(255,255,255,0.5)",
                  fontSize: "0.9rem",
                  lineHeight: 1.6,
                  fontFamily: "DM Sans, sans-serif",
                }}
              >
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
