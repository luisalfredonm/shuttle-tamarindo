import Link from "next/link";

export default function Hero() {
  return (
    <section
      style={{
        background:
          "linear-gradient(135deg, var(--brand-dark) 0%, var(--brand-green) 100%)",
        minHeight: "100vh",
        paddingTop: "68px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        padding: "2rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative circle */}
      <div
        style={{
          position: "absolute",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          border: "1px solid rgba(201,151,58,0.2)",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: "900px",
          height: "900px",
          borderRadius: "50%",
          border: "1px solid rgba(201,151,58,0.1)",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", zIndex: 1, maxWidth: "800px" }}>
        <span
          style={{
            display: "inline-block",
            background: "rgba(201,151,58,0.15)",
            border: "1px solid rgba(201,151,58,0.4)",
            color: "var(--brand-gold)",
            padding: "6px 18px",
            borderRadius: "100px",
            fontSize: "13px",
            fontFamily: "DM Sans, sans-serif",
            letterSpacing: "0.08em",
            marginBottom: "2rem",
            textTransform: "uppercase",
          }}
        >
          Guaranteed Departures · No Minimum Passengers
        </span>

        <h1
          style={{
            fontSize: "clamp(2.8rem, 7vw, 5.5rem)",
            color: "#fff",
            lineHeight: 1.1,
            marginBottom: "1.5rem",
            fontWeight: 700,
          }}
        >
          Your Ride Awaits
          <br />
          <span style={{ color: "var(--brand-gold)" }}>in Guanacaste</span>
        </h1>

        <p
          style={{
            fontSize: "1.15rem",
            color: "rgba(255,255,255,0.75)",
            maxWidth: "560px",
            margin: "0 auto 2.5rem",
            lineHeight: 1.7,
            fontWeight: 300,
          }}
        >
          Shared shuttles and private transfers from Tamarindo to Liberia
          Airport and all major destinations. Always on time, always guaranteed.
        </p>

        <div
          style={{
            display: "flex",
            gap: "1rem",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Link
            href="#book"
            style={{
              background: "var(--brand-gold)",
              color: "var(--brand-dark)",
              padding: "14px 32px",
              borderRadius: "var(--radius)",
              fontWeight: 500,
              fontSize: "1rem",
              textDecoration: "none",
              fontFamily: "DM Sans, sans-serif",
            }}
          >
            Book Your Transfer
          </Link>
          <Link
            href="#routes"
            style={{
              background: "rgba(255,255,255,0.1)",
              color: "#fff",
              padding: "14px 32px",
              borderRadius: "var(--radius)",
              fontWeight: 500,
              fontSize: "1rem",
              textDecoration: "none",
              border: "1px solid rgba(255,255,255,0.2)",
              fontFamily: "DM Sans, sans-serif",
            }}
          >
            View Routes
          </Link>
        </div>

        {/* Stats */}
        <div
          style={{
            display: "flex",
            gap: "3rem",
            justifyContent: "center",
            marginTop: "4rem",
            flexWrap: "wrap",
          }}
        >
          {[
            { num: "100%", label: "Guaranteed Departures" },
            { num: "6+", label: "Daily Routes" },
            { num: "24/7", label: "Support" },
          ].map((s) => (
            <div key={s.label}>
              <div
                style={{
                  fontSize: "2rem",
                  fontWeight: 700,
                  color: "var(--brand-gold)",
                  fontFamily: "Playfair Display, serif",
                }}
              >
                {s.num}
              </div>
              <div
                style={{
                  fontSize: "0.85rem",
                  color: "rgba(255,255,255,0.55)",
                  marginTop: "4px",
                  fontFamily: "DM Sans, sans-serif",
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
