const STEPS = [
  {
    num: "01",
    title: "Choose Your Route",
    desc: "Select origin, destination, date and number of passengers.",
  },
  {
    num: "02",
    title: "Pick a Departure",
    desc: "Choose from our daily departures at 9 AM, 2 PM or 6 PM.",
  },
  {
    num: "03",
    title: "Pay Securely",
    desc: "Complete your booking with our secure payment system.",
  },
  {
    num: "04",
    title: "We Pick You Up",
    desc: "Your driver arrives at your hotel or address on time.",
  },
];

export default function HowItWorks() {
  return (
    <section style={{ background: "#fff", padding: "5rem 2rem" }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <h2
          style={{
            textAlign: "center",
            fontSize: "2.2rem",
            marginBottom: "0.5rem",
          }}
        >
          How It Works
        </h2>
        <p
          style={{
            textAlign: "center",
            color: "var(--brand-gray)",
            marginBottom: "3.5rem",
            fontFamily: "DM Sans, sans-serif",
          }}
        >
          Book your transfer in under 2 minutes
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: "2rem",
          }}
        >
          {STEPS.map((s, i) => (
            <div key={s.num} style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: "3rem",
                  fontFamily: "Playfair Display, serif",
                  color: "var(--brand-green)",
                  opacity: 0.2,
                  lineHeight: 1,
                  marginBottom: "0.75rem",
                }}
              >
                {s.num}
              </div>
              <h3
                style={{
                  fontSize: "1.05rem",
                  fontFamily: "DM Sans, sans-serif",
                  fontWeight: 500,
                  marginBottom: "0.5rem",
                }}
              >
                {s.title}
              </h3>
              <p
                style={{
                  color: "var(--brand-gray)",
                  fontSize: "0.9rem",
                  lineHeight: 1.6,
                  fontFamily: "DM Sans, sans-serif",
                }}
              >
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
