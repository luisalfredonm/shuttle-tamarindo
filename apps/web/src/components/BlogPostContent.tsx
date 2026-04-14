import Link from "next/link";
import { BlogPost } from "@/lib/blog/posts";

interface Props {
  post: BlogPost;
  related: BlogPost[];
}

export default function BlogPostContent({ post, related }: Props) {
  const paragraphs = post.content
    .trim()
    .split("\n")
    .filter((line) => line.trim() !== "");

  return (
    <>
      {/* Article schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: post.title,
            description: post.metaDescription,
            datePublished: post.publishedAt,
            author: { "@type": "Organization", name: "Shuttle Tamarindo" },
            publisher: { "@type": "Organization", name: "Shuttle Tamarindo" },
            keywords: post.keywords.join(", "),
          }),
        }}
      />

      <main
        style={{
          paddingTop: "68px",
          background: "var(--brand-cream)",
          minHeight: "100vh",
        }}
      >
        {/* Hero */}
        <section
          style={{
            background:
              "linear-gradient(135deg, var(--brand-dark) 0%, var(--brand-green) 100%)",
            padding: "4rem 2rem",
          }}
        >
          <div style={{ maxWidth: "760px", margin: "0 auto" }}>
            <Link
              href="/blog"
              style={{
                color: "rgba(255,255,255,0.55)",
                fontFamily: "DM Sans, sans-serif",
                fontSize: "0.85rem",
                textDecoration: "none",
                display: "inline-block",
                marginBottom: "1.5rem",
              }}
            >
              ← Blog
            </Link>

            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                alignItems: "center",
                marginBottom: "1rem",
              }}
            >
              <span
                style={{
                  background:
                    post.category === "Travel Tips"
                      ? "rgba(26,107,74,0.3)"
                      : "rgba(201,151,58,0.25)",
                  color:
                    post.category === "Travel Tips"
                      ? "#9fe1cb"
                      : "var(--brand-gold)",
                  padding: "4px 12px",
                  borderRadius: "100px",
                  fontSize: "0.78rem",
                  fontFamily: "DM Sans, sans-serif",
                  fontWeight: 500,
                }}
              >
                {post.category}
              </span>
              <span
                style={{
                  fontSize: "0.8rem",
                  color: "rgba(255,255,255,0.45)",
                  fontFamily: "DM Sans, sans-serif",
                }}
              >
                {post.readingTime} min read
              </span>
            </div>

            <h1
              style={{
                fontSize: "clamp(1.6rem, 4vw, 2.6rem)",
                color: "#fff",
                lineHeight: 1.2,
                marginBottom: "1rem",
              }}
            >
              {post.title}
            </h1>

            <p
              style={{
                color: "rgba(255,255,255,0.65)",
                fontFamily: "DM Sans, sans-serif",
                fontSize: "1rem",
                lineHeight: 1.6,
                marginBottom: "1.5rem",
              }}
            >
              {post.excerpt}
            </p>

            <span
              style={{
                fontSize: "0.8rem",
                color: "rgba(255,255,255,0.4)",
                fontFamily: "DM Sans, sans-serif",
              }}
            >
              Published{" "}
              {new Date(post.publishedAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
        </section>

        {/* Article content */}
        <section style={{ padding: "3rem 2rem" }}>
          <div
            style={{
              maxWidth: "760px",
              margin: "0 auto",
              display: "grid",
              gridTemplateColumns: "1fr 280px",
              gap: "3rem",
              alignItems: "start",
            }}
          >
            {/* Main content */}
            <article style={{ minWidth: 0 }}>
              <div
                style={{
                  background: "#fff",
                  borderRadius: "16px",
                  padding: "2.5rem",
                  border: "1px solid #e8e4dc",
                }}
              >
                {paragraphs.map((line, i) => {
                  if (line.startsWith("## ")) {
                    return (
                      <h2
                        key={i}
                        style={{
                          fontSize: "1.4rem",
                          marginTop: i === 0 ? 0 : "2rem",
                          marginBottom: "0.875rem",
                          color: "var(--brand-dark)",
                        }}
                      >
                        {line.replace("## ", "")}
                      </h2>
                    );
                  }
                  if (line.startsWith("### ")) {
                    return (
                      <h3
                        key={i}
                        style={{
                          fontSize: "1.1rem",
                          fontFamily: "DM Sans, sans-serif",
                          fontWeight: 500,
                          marginTop: "1.5rem",
                          marginBottom: "0.5rem",
                          color: "var(--brand-dark)",
                        }}
                      >
                        {line.replace("### ", "")}
                      </h3>
                    );
                  }
                  if (line.startsWith("- ")) {
                    return (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          gap: "10px",
                          marginBottom: "6px",
                          fontFamily: "DM Sans, sans-serif",
                          fontSize: "0.95rem",
                          color: "var(--brand-dark)",
                          lineHeight: 1.6,
                        }}
                      >
                        <span
                          style={{
                            color: "var(--brand-green)",
                            flexShrink: 0,
                            fontWeight: 700,
                          }}
                        >
                          •
                        </span>
                        <span
                          dangerouslySetInnerHTML={{
                            __html: line
                              .replace("- ", "")
                              .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
                          }}
                        />
                      </div>
                    );
                  }
                  if (line.startsWith("| ")) {
                    return null;
                  }
                  if (line.startsWith("**")) {
                    return (
                      <p
                        key={i}
                        style={{
                          fontFamily: "DM Sans, sans-serif",
                          fontSize: "0.95rem",
                          lineHeight: 1.7,
                          marginBottom: "0.75rem",
                          color: "var(--brand-dark)",
                        }}
                        dangerouslySetInnerHTML={{
                          __html: line.replace(
                            /\*\*(.*?)\*\*/g,
                            "<strong>$1</strong>",
                          ),
                        }}
                      />
                    );
                  }
                  return (
                    <p
                      key={i}
                      style={{
                        fontFamily: "DM Sans, sans-serif",
                        fontSize: "0.975rem",
                        lineHeight: 1.75,
                        marginBottom: "1rem",
                        color: "var(--brand-dark)",
                      }}
                      dangerouslySetInnerHTML={{
                        __html: line.replace(
                          /\*\*(.*?)\*\*/g,
                          "<strong>$1</strong>",
                        ),
                      }}
                    />
                  );
                })}
              </div>

              {/* CTA dentro del artículo */}
              <div
                style={{
                  background: "var(--brand-green)",
                  borderRadius: "16px",
                  padding: "2rem",
                  marginTop: "1.5rem",
                  textAlign: "center",
                }}
              >
                <h3
                  style={{
                    color: "#fff",
                    fontSize: "1.3rem",
                    marginBottom: "0.5rem",
                  }}
                >
                  Ready to book your transfer?
                </h3>
                <p
                  style={{
                    color: "rgba(255,255,255,0.75)",
                    fontFamily: "DM Sans, sans-serif",
                    fontSize: "0.9rem",
                    marginBottom: "1.25rem",
                  }}
                >
                  Guaranteed departures · No minimum passengers · From
                  $30/person
                </p>
                <Link
                  href="/#book"
                  style={{
                    background: "#fff",
                    color: "var(--brand-green)",
                    padding: "12px 28px",
                    borderRadius: "8px",
                    fontFamily: "DM Sans, sans-serif",
                    fontWeight: 500,
                    fontSize: "0.95rem",
                    textDecoration: "none",
                  }}
                >
                  Book Now
                </Link>
              </div>
            </article>

            {/* Sidebar */}
            <aside
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.25rem",
              }}
            >
              {/* Keywords / tags */}
              <div
                style={{
                  background: "#fff",
                  borderRadius: "14px",
                  padding: "1.25rem",
                  border: "1px solid #e8e4dc",
                }}
              >
                <h4
                  style={{
                    fontFamily: "DM Sans, sans-serif",
                    fontWeight: 500,
                    fontSize: "0.85rem",
                    marginBottom: "0.875rem",
                    color: "var(--brand-dark)",
                  }}
                >
                  Topics
                </h4>
                <div
                  style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}
                >
                  {post.keywords.map((k) => (
                    <span
                      key={k}
                      style={{
                        background: "#f7f3ec",
                        border: "1px solid #e8e4dc",
                        borderRadius: "100px",
                        padding: "4px 12px",
                        fontSize: "0.78rem",
                        fontFamily: "DM Sans, sans-serif",
                        color: "var(--brand-gray)",
                      }}
                    >
                      {k}
                    </span>
                  ))}
                </div>
              </div>

              {/* Popular routes widget */}
              <div
                style={{
                  background: "var(--brand-dark)",
                  borderRadius: "14px",
                  padding: "1.25rem",
                  border: "1px solid #e8e4dc",
                }}
              >
                <h4
                  style={{
                    fontFamily: "DM Sans, sans-serif",
                    fontWeight: 500,
                    fontSize: "0.85rem",
                    marginBottom: "1rem",
                    color: "#fff",
                  }}
                >
                  Popular routes
                </h4>
                {[
                  {
                    label: "Tamarindo → LIR",
                    price: "$30",
                    href: "/routes/tamarindo-liberia-airport",
                  },
                  {
                    label: "LIR → Tamarindo",
                    price: "$30",
                    href: "/routes/liberia-airport-tamarindo",
                  },
                  {
                    label: "Tamarindo → Arenal",
                    price: "$55",
                    href: "/routes/tamarindo-arenal",
                  },
                  {
                    label: "Tamarindo → Monteverde",
                    price: "$45",
                    href: "/routes/tamarindo-monteverde",
                  },
                ].map((r) => (
                  <Link
                    key={r.href}
                    href={r.href}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "8px 0",
                      borderBottom: "1px solid rgba(255,255,255,0.06)",
                      textDecoration: "none",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "DM Sans, sans-serif",
                        fontSize: "0.85rem",
                        color: "rgba(255,255,255,0.65)",
                      }}
                    >
                      {r.label}
                    </span>
                    <span
                      style={{
                        fontFamily: "DM Sans, sans-serif",
                        fontSize: "0.85rem",
                        color: "var(--brand-gold)",
                        fontWeight: 500,
                      }}
                    >
                      {r.price}
                    </span>
                  </Link>
                ))}
              </div>
            </aside>
          </div>
        </section>

        {/* Related posts */}
        {related.length > 0 && (
          <section style={{ background: "#fff", padding: "3rem 2rem" }}>
            <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
              <h2 style={{ fontSize: "1.5rem", marginBottom: "1.75rem" }}>
                Related articles
              </h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: "1.25rem",
                }}
              >
                {related.map((p) => (
                  <Link
                    key={p.slug}
                    href={"/blog/" + p.slug}
                    style={{ textDecoration: "none" }}
                  >
                    <div
                      style={{
                        background: "var(--brand-cream)",
                        borderRadius: "14px",
                        padding: "1.5rem",
                        border: "1px solid #e8e4dc",
                        cursor: "pointer",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--brand-gray)",
                          fontFamily: "DM Sans, sans-serif",
                          display: "block",
                          marginBottom: "0.5rem",
                        }}
                      >
                        {p.category} · {p.readingTime} min
                      </span>
                      <h3
                        style={{
                          fontSize: "0.95rem",
                          lineHeight: 1.4,
                          marginBottom: "0.5rem",
                        }}
                      >
                        {p.title}
                      </h3>
                      <span
                        style={{
                          fontSize: "0.85rem",
                          color: "var(--brand-green)",
                          fontFamily: "DM Sans, sans-serif",
                          fontWeight: 500,
                        }}
                      >
                        Read →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </>
  );
}
