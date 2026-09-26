import { MapPin } from "lucide-react";
import { BRAND_WHATSAPP } from "@/lib/brand";
import s from "./home.module.css";

/** Zonas donde el negocio recoge hoy (confirmadas por el cliente) */
export const PICKUP_AREAS = ["Tamarindo", "Playa Langosta", "Playa Grande", "Playa Avellanas", "Flamingo", "Conchal"];

export default function PickupAreas() {
  return (
    <section className={`${s.section} ${s.cream}`} aria-labelledby="pickup-areas">
      <div className={`${s.narrow} ${s.center}`}>
        <h2 id="pickup-areas" className={s.h2}>
          Where we pick you up
        </h2>
        <p className={s.lead}>We pick you up at your hotel, vacation rental or condo in:</p>
        <ul className={s.areas}>
          {PICKUP_AREAS.map((a) => (
            <li key={a}>
              <MapPin size={15} /> {a}
            </li>
          ))}
        </ul>
        <p className={s.lead}>
          Staying somewhere else in Guanacaste?{" "}
          <a href={`https://wa.me/${BRAND_WHATSAPP}`} target="_blank" rel="noopener noreferrer" className={s.ghostLink}>
            Message us on WhatsApp
          </a>{" "}
          and we&apos;ll quote your transfer.
        </p>
      </div>
    </section>
  );
}
