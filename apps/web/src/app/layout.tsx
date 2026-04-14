import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/lib/auth/auth-context";
import Analytics from "@/components/Analytics";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://shuttletamarindo.com";

export const viewport: Viewport = {
  themeColor: "#1a6b4a",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default:
      "Shuttle Tamarindo | Guaranteed Transfers in Guanacaste, Costa Rica",
    template: "%s | Shuttle Tamarindo",
  },
  description:
    "Shared shuttles and private transfers from Tamarindo to Liberia Airport and all major destinations in Costa Rica. Guaranteed departures, no minimum passengers. From $30/person.",
  keywords: [
    "shuttle tamarindo",
    "transfer liberia airport",
    "shuttle guanacaste",
    "tamarindo to liberia airport",
    "costa rica shuttle service",
    "tamarindo airport transfer",
    "liberia airport to tamarindo",
    "guanacaste transportation",
    "costa rica private transfer",
    "tamarindo arenal shuttle",
  ],
  authors: [{ name: "Shuttle Tamarindo", url: BASE_URL }],
  creator: "Shuttle Tamarindo",
  publisher: "Shuttle Tamarindo",
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
    siteName: "Shuttle Tamarindo",
    title: "Shuttle Tamarindo | Guaranteed Transfers in Guanacaste",
    description:
      "Shared shuttles and private transfers from Tamarindo to Liberia Airport. Guaranteed departures, no minimum passengers. Book online in 2 minutes.",
    images: [
      {
        url: BASE_URL + "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Shuttle Tamarindo — Guaranteed Transfers in Guanacaste",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Shuttle Tamarindo | Guaranteed Transfers in Guanacaste",
    description:
      "Shared shuttles and private transfers in Guanacaste. From $30/person. Guaranteed departures.",
    images: [BASE_URL + "/og-image.jpg"],
  },
  alternates: {
    canonical: BASE_URL,
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || "",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body>
        <AuthProvider>
          <Navbar />
          {children}
          <Footer />
          <Analytics />
        </AuthProvider>
      </body>
    </html>
  );
}
