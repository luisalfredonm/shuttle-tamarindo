import type { Metadata, Viewport } from "next";
// Fuentes auto-hospedadas: reemplazan el @import de Google Fonts, que bloqueaba
// el render. Solo los pesos que se usan (DM Sans 300/400/500, Playfair 500/600/700).
// @fontsource registra las familias con su nombre real ("DM Sans", "Playfair
// Display"), así que los estilos inline de los componentes siguen funcionando.
import "@fontsource/dm-sans/300.css";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/playfair-display/500.css";
import "@fontsource/playfair-display/600.css";
import "@fontsource/playfair-display/700.css";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/lib/auth/auth-context";
import Analytics from "@/components/Analytics";
import WhatsAppButton from "@/components/WhatsAppButton";
import { BRAND_HERO_IMAGE, BRAND_LOGO, SITE_URL as BASE_URL } from "@/lib/brand";

export const viewport: Viewport = {
  themeColor: "#1a6b4a",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default:
      "Retana Services Tamarindo | Guaranteed Transfers in Guanacaste, Costa Rica",
    template: "%s | Retana Services Tamarindo",
  },
  description:
    "Shared shuttles and private transfers from Tamarindo to Liberia Airport and across Costa Rica. Shared seats from $30 per person; private transfers any time.",
  authors: [{ name: "Retana Services Tamarindo", url: BASE_URL }],
  creator: "Retana Services Tamarindo",
  publisher: "Retana Services Tamarindo",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: BASE_URL,
    siteName: "Retana Services Tamarindo",
    title: "Retana Services Tamarindo | Guaranteed Transfers in Guanacaste",
    description:
      "Shared shuttles and private transfers from Tamarindo to Liberia Airport. Shared seats from $30 per person, private transfers any time. Book online in 2 minutes.",
    images: [
      {
        // Foto real del servicio. Antes apuntaba a /og-image.jpg, que no
        // existe: cada enlace compartido salia con la imagen rota.
        url: BASE_URL + BRAND_HERO_IMAGE,
        width: 1200,
        height: 630,
        alt: "Retana Services Tamarindo — Guaranteed Transfers in Guanacaste",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Retana Services Tamarindo | Guaranteed Transfers in Guanacaste",
    description:
      "Shared shuttles and private transfers in Guanacaste. Shared seats from $30 per person, private transfers any time.",
    images: [BASE_URL + BRAND_HERO_IMAGE],
  },
  alternates: {
    canonical: BASE_URL,
  },
  ...(process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION
    ? { verification: { google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION } }
    : {}),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Apuntan al logo, que existe: /favicon.ico y /apple-touch-icon.png
            estaban referenciados pero nunca se subieron, y devolvian 404 en
            cada carga. Conviene generar los tamanos propios mas adelante. */}
        <link rel="icon" href={BRAND_LOGO} type="image/png" />
        <link rel="apple-touch-icon" href={BRAND_LOGO} />
        <link rel="manifest" href="/manifest.json" />
      </head>
      {/* suppressHydrationWarning: extensiones del navegador (ColorZilla, Grammarly)
          inyectan atributos en <body> antes de que React hidrate, causando un
          mismatch falso. Solo silencia el primer nivel: no oculta errores propios. */}
      <body suppressHydrationWarning>
        <AuthProvider>
          <Navbar />
          {children}
          <Footer />
          <WhatsAppButton />
          <Analytics />
        </AuthProvider>
      </body>
    </html>
  );
}
