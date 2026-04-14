import Link from "next/link";

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--brand-cream)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        paddingTop: "68px",
        textAlign: "center",
      }}
    >
      <div style={{ maxWidth: "500px" }}>
        <div
          style={{
            fontSize: "6rem",
            fontFamily: "Playfair Display, serif",
            fontWeight: 700,
            color: "var(--brand-green)",
            lineHeight: 1,
            marginBottom: "1rem",
            opacity: 0.2,
          }}
        >
          404
        </div>
        <h1 style={{ fontSize: "1.8rem", marginBottom: "0.75rem" }}>
          Page not found
        </h1>
        <p
          style={{
            color: "var(--brand-gray)",
            fontFamily: "DM Sans, sans-serif",
            fontSize: "1rem",
            lineHeight: 1.7,
            marginBottom: "2rem",
          }}
        >
          The page you are looking for does not exist or has been moved.
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
            href="/"
            style={{
              background: "var(--brand-green)",
              color: "#fff",
              padding: "12px 28px",
              borderRadius: "10px",
              fontFamily: "DM Sans, sans-serif",
              fontWeight: 500,
              fontSize: "0.95rem",
              textDecoration: "none",
            }}
          >
            Go home
          </Link>
          <Link
            href="/routes"
            style={{
              background: "#fff",
              color: "var(--brand-dark)",
              padding: "12px 28px",
              borderRadius: "10px",
              fontFamily: "DM Sans, sans-serif",
              fontWeight: 500,
              fontSize: "0.95rem",
              textDecoration: "none",
              border: "1px solid #e8e4dc",
            }}
          >
            View routes
          </Link>
        </div>
      </div>
    </main>
  );
}
