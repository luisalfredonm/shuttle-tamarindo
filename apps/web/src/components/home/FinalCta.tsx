import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { BRAND_WHATSAPP } from "@/lib/brand";
import s from "./home.module.css";

export default function FinalCta() {
  return (
    <section className={`${s.section} ${s.dark}`} aria-labelledby="final-cta">
      <div className={`${s.narrow} ${s.cta}`}>
        <h2 id="final-cta" className={s.h2}>
          Ready to ride?
        </h2>
        <p className={s.lead}>Book online in two minutes or message us on WhatsApp.</p>
        <div className={s.ctaButtons}>
          <Link href="#book" className={s.ctaGold}>
            Book your shuttle
          </Link>
          <a href={`https://wa.me/${BRAND_WHATSAPP}`} target="_blank" rel="noopener noreferrer" className={s.ctaWa}>
            <MessageCircle size={18} /> WhatsApp us
          </a>
        </div>
      </div>
    </section>
  );
}
