"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { apiFetch } from "@/lib/api";
import {
  bookingPill,
  dayLabel,
  isToday,
  money,
  occupancyColor,
  outboundLeg,
  ref,
  time,
  titleCase,
} from "@/lib/format";
import ui from "./ui/ui.module.css";
import s from "./dashboard/dashboard.module.css";

/* eslint-disable @typescript-eslint/no-explicit-any -- el API devuelve reservas y viajes sin tipos compartidos */

export default function DashboardContent() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch("/bookings/user/all").catch(() => []),
      apiFetch("/trips").catch(() => []),
    ])
      .then(([b, t]) => {
        setBookings(Array.isArray(b) ? b : []);
        setTrips(Array.isArray(t) ? t : []);
      })
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const upcoming = trips.filter((t) => new Date(t.departureAt) >= now);
  const todayTrips = upcoming.filter((t) => isToday(t.departureAt));
  const todayPassengers = todayTrips.reduce((sum, t) => sum + (t.bookedSeats || 0), 0);

  const stats = [
    { label: "Confirmed", value: bookings.filter((b) => b.status === "CONFIRMED").length, color: "#1a6b4a" },
    { label: "Pending payment", value: bookings.filter((b) => b.status === "PENDING").length, color: "#8a6100" },
    {
      label: "Booked today",
      value: bookings.filter((b) => {
        const d = new Date(b.createdAt);
        return d.getDate() === now.getDate() && d.getMonth() === now.getMonth();
      }).length,
      color: "#1a5fa8",
    },
    {
      label: "Revenue",
      value: money(
        bookings.filter((b) => b.status === "CONFIRMED").reduce((sum, b) => sum + Number(b.totalAmount), 0),
      ),
      color: "#1a6b4a",
    },
    { label: "Upcoming trips", value: upcoming.length, color: "var(--text)" },
    { label: "All bookings", value: bookings.length, color: "var(--text)" },
  ];

  const recentBookings = [...bookings]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);
  const nextTrips = upcoming.slice(0, 5);

  return (
    <div>
      <section className={s.today} aria-label="Today">
        <div className={s.todayEyebrow}>Today</div>
        <div className={s.todayDate}>
          {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </div>

        <div className={s.todayStats}>
          <div className={s.todayStat}>
            <strong>{loading ? "–" : todayTrips.length}</strong>
            departures
          </div>
          <div className={s.todayStat}>
            <strong>{loading ? "–" : todayPassengers}</strong>
            seats booked
          </div>
        </div>

        {!loading &&
          (todayTrips.length > 0 ? (
            <div className={s.todayList}>
              {todayTrips.map((t) => (
                <Link key={t.id} href="/trips" className={s.todayTrip}>
                  <span className={s.todayTime}>{time(t.departureAt)}</span>
                  <span className={s.todayRoute}>
                    {t.route?.origin} → {t.route?.destination}
                  </span>
                  <span className={s.todaySeats}>
                    {t.bookedSeats}/{t.capacity}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className={s.todayEmpty}>No departures today.</p>
          ))}
      </section>

      <div className={s.tiles}>
        {stats.map((st) => (
          <div key={st.label} className={s.tile}>
            <div className={s.tileValue} style={{ color: st.color }}>
              {loading ? "–" : st.value}
            </div>
            <div className={s.tileLabel}>{st.label}</div>
          </div>
        ))}
      </div>

      <div className={ui.grid2}>
        <section className={ui.card}>
          <div className={s.sectionHead}>
            <h2>Recent bookings</h2>
            <Link href="/bookings" className={s.sectionLink}>
              View all <ChevronRight size={15} />
            </Link>
          </div>
          {loading ? (
            <div className={ui.row}><span className={ui.muted}>Loading...</span></div>
          ) : recentBookings.length === 0 ? (
            <div className={ui.row}><span className={ui.muted}>No bookings yet</span></div>
          ) : (
            recentBookings.map((b) => {
              const leg = outboundLeg(b);
              return (
                <Link key={b.id} href="/bookings" className={ui.row}>
                  <div className={ui.rowMain}>
                    <div className={ui.rowTitle}>
                      {leg?.trip?.route?.origin} → {leg?.trip?.route?.destination}
                    </div>
                    <div className={ui.rowMeta}>
                      {ref(b.id)} · {b.passengers} pax
                      {b.tripType === "ROUND_TRIP" && " · round trip"}
                    </div>
                  </div>
                  <div className={ui.rowEnd}>
                    <div className={ui.money}>{money(b.totalAmount)}</div>
                    <span className={`${ui.pill} ${ui[bookingPill(b.status)]}`} style={{ marginTop: 4 }}>
                      {titleCase(b.status)}
                    </span>
                  </div>
                </Link>
              );
            })
          )}
        </section>

        <section className={ui.card}>
          <div className={s.sectionHead}>
            <h2>Upcoming trips</h2>
            <Link href="/trips" className={s.sectionLink}>
              View all <ChevronRight size={15} />
            </Link>
          </div>
          {loading ? (
            <div className={ui.row}><span className={ui.muted}>Loading...</span></div>
          ) : nextTrips.length === 0 ? (
            <div className={ui.row}><span className={ui.muted}>No upcoming trips</span></div>
          ) : (
            nextTrips.map((t) => {
              const pct = t.capacity ? Math.round((t.bookedSeats / t.capacity) * 100) : 0;
              return (
                <Link key={t.id} href="/trips" className={ui.row}>
                  <div className={ui.rowMain}>
                    <div className={ui.rowTitle}>
                      {t.route?.origin} → {t.route?.destination}
                    </div>
                    <div className={ui.rowMeta}>
                      {dayLabel(t.departureAt)} · {time(t.departureAt)}
                    </div>
                  </div>
                  <div className={ui.rowEnd}>
                    <div style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                      {t.bookedSeats}/{t.capacity}
                    </div>
                    <div className={s.seatBar}>
                      <span style={{ width: `${pct}%`, background: occupancyColor(pct) }} />
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </section>
      </div>
    </div>
  );
}
