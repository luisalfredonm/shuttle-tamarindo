import type { HomeData } from "@/lib/home-data";
import s from "./home.module.css";

/**
 * Compartido o privado, lado a lado.
 *
 * Es la duda que tiene todo el que busca un shuttle, y una tabla es el
 * formato que los buscadores extraen tal cual para responderla.
 */
export default function CompareSection({ data }: { data: HomeData }) {
  const { sharedFrom, privateFrom, pricing } = data;

  return (
    <section className={`${s.section} ${s.white}`} aria-labelledby="compare">
      <div className={`${s.narrow} ${s.center}`}>
        <h2 id="compare" className={s.h2}>
          Shared shuttle or private transfer?
        </h2>
        <p className={s.lead}>Both go door to door. The difference is who you ride with and when you leave.</p>

        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>
                <th scope="col">
                  <span className="sr-only">Feature</span>
                </th>
                <th scope="col">Shared shuttle</th>
                <th scope="col">Private transfer</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Price</th>
                <td>{sharedFrom !== null ? <>Per person, from <strong>${sharedFrom}</strong></> : "Per person"}</td>
                <td>{privateFrom !== null ? <>Per van, from <strong>${privateFrom}</strong></> : "Per van"}</td>
              </tr>
              <tr>
                <th scope="row">Includes</th>
                <td>Your seat</td>
                <td>
                  Up to {pricing.includedPassengers} passengers; ${pricing.extraPassengerPrice} per extra passenger
                </td>
              </tr>
              <tr>
                <th scope="row">Schedule</th>
                <td>Fixed departures</td>
                <td>Any time you choose</td>
              </tr>
              <tr>
                <th scope="row">Best for</th>
                <td>Solo travelers and couples</td>
                <td>Families, groups, early or late flights</td>
              </tr>
              <tr>
                <th scope="row">Kids</th>
                <td>Children pay a seat</td>
                <td>Infants (0–2) ride free</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
