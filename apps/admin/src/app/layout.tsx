import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

/** Mismo sello que el sitio, reducido a 180px para no cargar el PNG de 660 KB */
const ADMIN_ICON = "/logo-retana-services-tamarindo.png";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#1a6b4a",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  // El default lo usa el login, que es un componente de cliente y no exporta
  // metadata propia: era la pantalla que seguia diciendo "Create Next App".
  // Las demas paginas ponen su titulo ("Bookings", "Trips") y el template les
  // agrega la marca.
  title: {
    default: "Retana Services Tamarindo · Admin",
    template: "%s · Retana Services Tamarindo",
  },
  description: "Panel interno de reservas, rutas y horarios.",
  // El panel es privado: sin esto Google puede indexar admin.retanaservices.com
  // y dejar las URLs internas a la vista en los resultados de busqueda.
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
  icons: {
    icon: { url: ADMIN_ICON, type: "image/png" },
    apple: ADMIN_ICON,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
