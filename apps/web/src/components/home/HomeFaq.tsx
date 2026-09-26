import FaqItem from "@/components/FaqItem";
import type { FaqEntry } from "@/lib/home-faq";
import s from "./home.module.css";

export default function HomeFaq({ faq }: { faq: FaqEntry[] }) {
  return (
    <section className={`${s.section} ${s.white}`} aria-labelledby="home-faq">
      <div className={s.narrow}>
        <h2 id="home-faq" className={`${s.h2} ${s.center}`} style={{ textAlign: "center" }}>
          Tamarindo shuttle FAQ
        </h2>
        <div className={s.faqList}>
          {faq.map((f, i) => (
            <FaqItem key={f.q} id={`home-${i}`} q={f.q} a={f.a} link={f.link} />
          ))}
        </div>
      </div>
    </section>
  );
}
