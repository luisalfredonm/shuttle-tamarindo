import type { Metadata } from "next";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { getActiveRoutes } from "@/lib/api";
import { buildRouteView, type RouteView } from "@/lib/route-view";
import { pairRoutes } from "@/lib/route-pairs";
import { BRAND_WHATSAPP } from "@/lib/brand";
import RouteHubCard from "@/components/RouteHubCard";
import RoutesHubSchema from "@/components/RoutesHubSchema";

/*
 * Índice de rutas y precios: reparte el enlazado interno hacia cada página
 * de ruta. Es neutro a propósito: no nombra ninguna ruta en el title ni en el
 * H1 para no competir con las páginas que sí atacan esas búsquedas (la
 * "liberia airport to tamarindo shuttle" es de su página; "tamarindo shuttle"
 * es de la home).
 */

const TITLE = "Shuttle Routes & Prices in Guanacaste";

/** Una entrada por página pública: el sentido inverso vive en la misma */
async function hubRoutes() {
  return pairRoutes(await getActiveRoutes()).map(({ route, reverse }) => ({
    view: buildRouteView(route),
    bothWays: !!reverse,
  }));
}

export async function generateMetadata(): Promise<Metadata> {
  const routes = (await getActiveRoutes()).map(buildRouteView);

  // La descripción sale de lo que de verdad se vende: antes prometía salidas
  // diarias a Arenal, Monteverde y San José que no existían
  const shared = routes
    .filter((r) => r.sharedEnabled)
    .map((r) => r.priceShared);
  const priv = routes.map((r) => r.pricePrivate);
  const prices = [
    shared.length
      ? `shared seats from $${Math.min(...shared)} per person`
      : null,
    priv.length ? `private vans from $${Math.min(...priv)}` : null,
  ].filter(Boolean);

  const description = routes.length
    ? `Shuttle and private transfer prices across Guanacaste, Costa Rica: ${prices.join(", ")}. Fixed prices, no hidden fees. Book online or on WhatsApp.`
    : "Shuttle and private transfer routes across Guanacaste, Costa Rica. Fixed prices, no hidden fees. Message us on WhatsApp.";

  return {
    title: TITLE,
    description,
    // Sin esto hereda el canonical del layout (la home) y Google la toma como duplicado
    alternates: { canonical: "/routes" },
    openGraph: { title: TITLE, description, url: "/routes" },
  };
}

/**
 * Agrupa por origen para que la página se escanee por "¿desde dónde salgo?".
 * Los aeropuertos van primero: es por donde llega casi todo el que busca.
 */
type HubRoute = { view: RouteView; bothWays: boolean };

function groupByOrigin(routes: HubRoute[]) {
  const groups = new Map<string, HubRoute[]>();
  for (const r of routes)
    groups.set(r.view.origin, [...(groups.get(r.view.origin) ?? []), r]);

  const isAirport = (origin: string) =>
    /airport|aeropuerto|\b(lir|sjo)\b/i.test(origin);
  return [...groups.entries()].sort(
    ([a, ra], [b, rb]) =>
      Number(isAirport(b)) - Number(isAirport(a)) ||
      rb.length - ra.length ||
      a.localeCompare(b),
  );
}

export default async function RoutesIndexPage() {
  // El listado sale de la base: lo que se da de alta en el panel aparece solo,
  // y lo que se da de baja deja de ofrecerse sin tocar codigo.
  const routes = await hubRoutes();
  const groups = groupByOrigin(routes);
  const ordered = groups.flatMap(([, rs]) => rs.map((r) => r.view));

  return (
    <main className="hub">
      <RoutesHubSchema routes={ordered} />

      <section className="hub-hero">
        <div className="hub-hero-inner">
          <nav aria-label="Breadcrumb" className="hub-crumbs">
            <Link href="/">Home</Link> <span aria-hidden="true">/</span>{" "}
            <span aria-current="page">Routes &amp; prices</span>
          </nav>
          <h1>
            Guanacaste shuttle routes <span>and prices</span>
          </h1>
          <p>
            Shared shuttle seats are priced per person; private transfers are
            priced per van, not per passenger. Every price is fixed, with no
            hidden fees. Book online in two minutes or message us on WhatsApp.
          </p>
        </div>
      </section>

      <div className="hub-content">
        {routes.length === 0 ? (
          <div className="hub-empty">
            <h2>Routes coming soon</h2>
            <p>
              We are setting up our schedule. Message us on WhatsApp and
              we&apos;ll quote your transfer right away.
            </p>
            <a
              href={`https://wa.me/${BRAND_WHATSAPP}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hub-btn"
            >
              <MessageCircle size={18} /> Message us on WhatsApp
            </a>
          </div>
        ) : (
          groups.map(([origin, rs]) => (
            <section
              key={origin}
              className="hub-group"
              aria-labelledby={`from-${rs[0].view.slug}`}
            >
              <h2 id={`from-${rs[0].view.slug}`}>From {origin}</h2>
              <div className="hub-grid">
                {rs.map((r) => (
                  <RouteHubCard
                    key={r.view.slug}
                    route={r.view}
                    bothWays={r.bothWays}
                  />
                ))}
              </div>
            </section>
          ))
        )}

        {routes.length > 0 && (
          <aside className="hub-cta">
            <div>
              <h2>Don&apos;t see your route?</h2>
              <p>
                We run private transfers across Guanacaste and Costa Rica on
                request. Tell us where and when.
              </p>
            </div>
            <a
              href={`https://wa.me/${BRAND_WHATSAPP}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hub-btn"
            >
              <MessageCircle size={18} /> Ask on WhatsApp
            </a>
          </aside>
        )}
      </div>

      <style>{`
        .hub { padding-top: 68px; min-height: 100vh; background: var(--brand-cream); }

        .hub-hero {
          background:
            radial-gradient(120% 90% at 90% 0%, rgba(201,151,58,0.28) 0%, rgba(201,151,58,0) 55%),
            linear-gradient(140deg, var(--brand-dark) 0%, var(--brand-green) 100%);
          color: #fff; padding: 2.5rem 0 2.75rem; text-align: left;
        }
        .hub-hero-inner { max-width: 1100px; margin: 0 auto; padding: 0 1.25rem; }
        .hub-crumbs { font-family: DM Sans, sans-serif; font-size: 0.8rem; color: rgba(255,255,255,0.6); margin-bottom: 1rem; }
        .hub-crumbs a { color: rgba(255,255,255,0.85); text-decoration: none; }
        .hub-crumbs a:hover { text-decoration: underline; }
        .hub-hero h1 {
          font-family: "Playfair Display", serif; font-weight: 600;
          font-size: clamp(1.9rem, 5vw, 3.1rem); line-height: 1.12; margin-bottom: 0.9rem;
        }
        .hub-hero h1 span { display: block; color: var(--brand-gold); }
        .hub-hero p { font-family: DM Sans, sans-serif; font-size: clamp(0.95rem, 1.6vw, 1.05rem); line-height: 1.65; color: rgba(255,255,255,0.82); max-width: 62ch; }

        .hub-content { max-width: 1100px; margin: 0 auto; padding: 2.25rem 1.25rem 3.5rem; }
        .hub-group + .hub-group { margin-top: 2.5rem; }
        .hub-group h2 {
          font-family: "Playfair Display", serif; font-weight: 600; color: var(--brand-dark);
          font-size: clamp(1.35rem, 3vw, 1.75rem); margin-bottom: 1rem;
        }
        .hub-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr)); gap: 1.1rem; }

        .hub-card {
          display: flex; flex-direction: column; overflow: hidden;
          background: #fff; border: 1px solid #e8e4dc; border-radius: 18px;
          text-decoration: none; color: inherit;
          transition: box-shadow 0.2s, transform 0.2s, border-color 0.2s;
        }
        .hub-card:hover { box-shadow: 0 14px 36px -14px rgba(13,31,23,0.35); transform: translateY(-2px); border-color: #d8d1c3; }
        .hub-card:focus-visible { outline: 3px solid var(--brand-gold); outline-offset: 3px; }
        .hub-card-img { position: relative; aspect-ratio: 16 / 9; background: var(--brand-dark); }
        .hub-card-body { display: flex; flex-direction: column; gap: 0.7rem; padding: 1.1rem 1.2rem 1.2rem; flex: 1; }
        .hub-card-title { font-family: "Playfair Display", serif; font-size: 1.2rem; font-weight: 600; line-height: 1.3; color: var(--brand-dark); }
        .hub-card-title span { color: var(--brand-gold); }
        .hub-card-meta { display: flex; gap: 1rem; font-family: DM Sans, sans-serif; font-size: 0.82rem; color: var(--brand-gray); }
        .hub-card-meta span { display: inline-flex; align-items: center; gap: 5px; }
        .hub-card-meta .hub-both { padding: 1px 9px; border-radius: 999px; background: rgba(201,151,58,0.14); color: #8a6420; font-weight: 600; font-size: 0.74rem; }
        .hub-card-prices {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 0.75rem;
          padding: 0.8rem 0; border-top: 1px dashed #e0d9cc; border-bottom: 1px dashed #e0d9cc;
        }
        .hub-price-label { font-family: DM Sans, sans-serif; font-size: 0.68rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--brand-gray); margin-bottom: 2px; }
        .hub-price { font-family: "Playfair Display", serif; font-size: 1.45rem; font-weight: 700; color: var(--brand-green); line-height: 1.15; }
        .hub-price small { font-family: DM Sans, sans-serif; font-size: 0.72rem; font-weight: 500; color: var(--brand-gray); margin: 0 2px; }
        .hub-card-cta { margin-top: auto; display: inline-flex; align-items: center; gap: 4px; font-family: DM Sans, sans-serif; font-size: 0.9rem; font-weight: 600; color: var(--brand-green); }
        .hub-card:hover .hub-card-cta svg { transform: translate(2px, -2px); }
        .hub-card-cta svg { transition: transform 0.2s; }

        .hub-btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          min-height: 48px; padding: 0 20px; border-radius: 999px;
          background: #1f9d55; color: #fff; text-decoration: none;
          font-family: DM Sans, sans-serif; font-weight: 600; font-size: 0.95rem; white-space: nowrap;
        }
        .hub-btn:hover { background: #188a49; }
        .hub-btn:focus-visible { outline: 3px solid var(--brand-gold); outline-offset: 3px; }

        .hub-empty { text-align: center; padding: 3rem 1.25rem; background: #fff; border: 1.5px dashed #d8d1c3; border-radius: 18px; }
        .hub-empty h2 { font-family: "Playfair Display", serif; font-size: 1.5rem; color: var(--brand-dark); margin-bottom: 0.5rem; }
        .hub-empty p { font-family: DM Sans, sans-serif; color: var(--brand-gray); margin: 0 auto 1.25rem; max-width: 46ch; line-height: 1.6; }

        .hub-cta {
          display: flex; flex-direction: column; gap: 1rem; margin-top: 2.75rem;
          padding: 1.4rem; border-radius: 18px; background: #fff; border: 1px solid #e8e4dc;
        }
        .hub-cta h2 { font-family: "Playfair Display", serif; font-size: 1.3rem; color: var(--brand-dark); margin-bottom: 0.3rem; }
        .hub-cta p { font-family: DM Sans, sans-serif; font-size: 0.92rem; color: var(--brand-gray); line-height: 1.55; }

        /* Escritorio: cada ruta es una fila, foto a la izquierda y precios a la
           derecha. Se lee como una tabla de precios y no deja huecos cuando un
           origen tiene una sola ruta */
        @media (min-width: 760px) {
          .hub-grid { grid-template-columns: 1fr; gap: 0.9rem; }
          .hub-card { flex-direction: row; }
          .hub-card-img { aspect-ratio: auto; width: 240px; flex-shrink: 0; }
          .hub-card-body {
            display: grid; grid-template-columns: 1fr auto; grid-template-rows: auto auto 1fr;
            column-gap: 2rem; padding: 1.3rem 1.5rem;
          }
          .hub-card-title { grid-column: 1; font-size: 1.35rem; }
          .hub-card-meta { grid-column: 1; }
          .hub-card-prices {
            grid-column: 2; grid-row: 1 / span 2; align-self: start;
            grid-template-columns: repeat(2, auto); gap: 1.75rem; padding: 0; border: none; text-align: right;
          }
          .hub-card-cta { grid-column: 2; grid-row: 3; justify-self: end; align-self: end; }
        }
        @media (min-width: 700px) {
          .hub-hero { padding: 3.5rem 0 3.75rem; }
          .hub-hero-inner { padding: 0 2rem; }
          .hub-content { padding: 3rem 2rem 4.5rem; }
          .hub-cta { flex-direction: row; align-items: center; justify-content: space-between; padding: 1.6rem 1.8rem; }
        }
        @media (prefers-reduced-motion: reduce) {
          .hub-card, .hub-card:hover { transition: none; transform: none; }
        }
      `}</style>
    </main>
  );
}
