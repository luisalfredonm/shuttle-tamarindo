import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatDuration, type HomeData } from "@/lib/home-data";
import s from "./home.module.css";

/**
 * La ruta que más se busca (~3.600/mes) tiene su propia página; la home le
 * pasa autoridad con un enlace cuyo texto es exactamente la búsqueda:
 * "Liberia Airport to Tamarindo shuttle".
 */
export default function StarRouteSection({ star }: { star: NonNullable<HomeData["star"]> }) {
  const r = star.route;
  const duration = formatDuration(r.durationMin);

  return (
    <section className={`${s.section} ${s.cream}`} aria-labelledby="star-route">
      <div className={s.inner}>
        <div className={s.star}>
          <div className={s.starBody}>
            <span className={s.eyebrow}>Most booked route</span>
            <h2 id="star-route" className={s.h2}>
              Liberia Airport to Tamarindo shuttle
            </h2>
            <p className={s.lead}>
              Landing at Liberia International Airport (LIR)? Your driver meets you at arrivals with your name on a
              sign, tracks your flight in case it&apos;s late, and takes you straight to your hotel in Tamarindo,
              about {duration} away.{star.reverse && " Heading home? We pick you up at your hotel and get you to the airport on time."}
            </p>

            <ul className={s.starFacts}>
              {r.sharedEnabled && (
                <li>
                  <span>
                    Shared shuttle
                    {star.sharedSchedule && <small>{star.sharedSchedule}</small>}
                  </span>
                  <strong>${r.priceShared}<small style={{ display: "inline" }}> /person</small></strong>
                </li>
              )}
              <li>
                <span>
                  Private transfer
                  <small>At the time you choose</small>
                </span>
                <strong>${r.pricePrivate}<small style={{ display: "inline" }}> /van</small></strong>
              </li>
            </ul>

            <Link href={`/routes/${r.slug}`} className={s.starLink}>
              Liberia Airport to Tamarindo shuttle <ArrowRight size={18} />
            </Link>
          </div>

          <div className={s.starImg}>
            <Image
              src={r.heroImage}
              alt="Shuttle van from Liberia Airport to Tamarindo"
              fill
              sizes="(max-width: 860px) calc(100vw - 2.5rem), 50vw"
              style={{ objectFit: "cover" }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
