import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,

  experimental: {
    // El CSS entero pesa ~7 KiB comprimido: va inline en el HTML en vez de en
    // <link> bloqueantes. PageSpeed medía ~1 s de render bloqueado por esos
    // dos archivos, y el H1 (elemento LCP) esperaba por ellos.
    inlineCss: true,
  },

  // Solo se optimizan fotos del almacenamiento propio (las que sube el panel).
  // Cualquier otro dominio responde 400 en vez de servir de proxy abierto.
  images: {
    // AVIF primero: ~30% menos que WebP en las fotos de rutas. Los navegadores
    // sin soporte reciben WebP por el header Accept.
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
        pathname: "/routes/**",
        search: "",
      },
    ],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      {
        source: "/fonts/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  async redirects() {
    return [
      {
        source: "/transfer/:path*",
        destination: "/routes/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
