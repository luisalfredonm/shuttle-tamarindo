import type { Metadata } from "next";
import Link from "next/link";
import { BLOG_POSTS, getAllCategories } from "@/app/blog/posts";

export const metadata: Metadata = {
  title: "Travel Blog — Costa Rica Shuttle & Travel Tips",
  description:
    "Travel guides, shuttle tips, and destination guides for Guanacaste and Costa Rica. Everything you need to plan your perfect trip.",
  keywords: [
    "costa rica travel tips",
    "guanacaste travel guide",
    "tamarindo travel blog",
    "costa rica shuttle guide",
  ],
};

export default function BlogIndexPage() {
  const categories = getAllCategories();
  const featured = BLOG_POSTS.filter((p) => p.featured);
  const rest = BLOG_POSTS.filter((p) => !p.featured);

  return (
    <main
      style={{
        paddingTop: "68px",
        minHeight: "100vh",
        background: "var(--brand-cream)",
      }}
    >
      {/* Hero */}
      <section
        style={{
          background:
            "linear-gradient(135deg, var(--brand-dark) 0%, var(--brand-green) 100%)",
          padding: "4rem 2rem",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            color: "#fff",
            fontSize: "clamp(1.8rem, 4vw, 3rem)",
            marginBottom: "0.75rem",
          }}
        >
          Travel Blog
        </h1>
        <p
          style={{
            color: "rgba(255,255,255,0.65)",
            fontFamily: "DM Sans, sans-serif",
            fontSize: "1rem",
            maxWidth: "500px",
            margin: "0 auto",
          }}
        >
          Shuttle guides, destination tips and travel advice for Guanacaste and
          Costa Rica
        </p>
      </section>

      <section
        style={{ maxWidth: "1100px", margin: "0 auto", padding: "3rem 2rem" }}
      >
        {/* Categories */}
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            marginBottom: "2.5rem",
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              background: "var(--brand-green)",
              color: "#fff",
              padding: "6px 16px",
              borderRadius: "100px",
              fontFamily: "DM Sans, sans-serif",
              fontSize: "0.85rem",
            }}
          >
            All
          </span>
          {categories.map((c) => (
            <span
              key={c}
              style={{
                background: "#fff",
                color: "var(--brand-gray)",
                border: "1px solid #e8e4dc",
                padding: "6px 16px",
                borderRadius: "100px",
                fontFamily: "DM Sans, sans-serif",
                fontSize: "0.85rem",
                cursor: "pointer",
              }}
            >
              {c}
            </span>
          ))}
        </div>

        {/* Featured posts */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "1.5rem",
            marginBottom: "1.5rem",
          }}
        >
          {featured.map((post) => (
            <PostCard key={post.slug} post={post} large />
          ))}
        </div>

        {/* Rest of posts */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {rest.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      </section>
    </main>
  );
}

function PostCard({ post, large }: { post: any; large?: boolean }) {
  return (
    <Link href={"/blog/" + post.slug} style={{ textDecoration: "none" }}>
      <article
        style={{
          background: "#fff",
          borderRadius: "16px",
          border: "1px solid #e8e4dc",
          overflow: "hidden",
          cursor: "pointer",
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Color band based on category */}
        <div
          style={{
            height: large ? "8px" : "4px",
            background:
              post.category === "Travel Tips"
                ? "var(--brand-green)"
                : "var(--brand-gold)",
          }}
        />

        <div
          style={{
            padding: "1.5rem",
            flex: 1,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              alignItems: "center",
              marginBottom: "0.875rem",
            }}
          >
            <span
              style={{
                background:
                  post.category === "Travel Tips" ? "#f0faf5" : "#faf5e6",
                color:
                  post.category === "Travel Tips"
                    ? "var(--brand-green)"
                    : "#b07d00",
                padding: "3px 10px",
                borderRadius: "100px",
                fontSize: "0.75rem",
                fontFamily: "DM Sans, sans-serif",
                fontWeight: 500,
              }}
            >
              {post.category}
            </span>
            <span
              style={{
                fontSize: "0.75rem",
                color: "var(--brand-gray)",
                fontFamily: "DM Sans, sans-serif",
              }}
            >
              {post.readingTime} min read
            </span>
          </div>

          <h2
            style={{
              fontSize: large ? "1.15rem" : "1rem",
              lineHeight: 1.35,
              marginBottom: "0.75rem",
              color: "var(--brand-dark)",
              flex: 1,
            }}
          >
            {post.title}
          </h2>

          <p
            style={{
              color: "var(--brand-gray)",
              fontFamily: "DM Sans, sans-serif",
              fontSize: "0.875rem",
              lineHeight: 1.6,
              marginBottom: "1.25rem",
            }}
          >
            {post.excerpt}
          </p>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingTop: "1rem",
              borderTop: "1px solid #f0ece4",
            }}
          >
            <span
              style={{
                fontSize: "0.8rem",
                color: "var(--brand-gray)",
                fontFamily: "DM Sans, sans-serif",
              }}
            >
              {new Date(post.publishedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            <span
              style={{
                fontSize: "0.85rem",
                color: "var(--brand-green)",
                fontFamily: "DM Sans, sans-serif",
                fontWeight: 500,
              }}
            >
              Read more →
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
