/**
 * Sistema de plantillas de correo.
 *
 * Los correos no son HTML normal: Outlook ignora flex y grid, Gmail borra el
 * <style> en varios clientes y casi ninguno respeta border-radius en un <td>.
 * Por eso el layout va con tablas y estilos inline, y el <style> del head se
 * reserva para mejoras opcionales (responsive) que pueden perderse sin romper
 * nada.
 *
 * La paleta y la voz tipografica replican el sitio: verde/oro/crema y una
 * display serif (Playfair en web, Georgia en correo porque existe en todos los
 * clientes) sobre un cuerpo sans.
 */

import { CR_UTC_OFFSET_HOURS } from '../schedules/schedule-time';

export const BRAND = {
  name: 'Retana Services Tamarindo',
  tagline: 'Private & shared airport transfers · Guanacaste, Costa Rica',
  since: '2015',
  phone: '+50683183226',
  whatsapp: '50683183226',
  logoPath: '/logo-retana-services-tamarindo.png',
} as const;

/** Paleta, igual a la de globals.css del sitio */
const C = {
  green: '#1a6b4a',
  greenDeep: '#123f2c',
  greenSoft: '#b9cec3',
  dark: '#0d1f17',
  gold: '#c9973a',
  cream: '#f7f3ec',
  page: '#e9e5dd',
  line: '#e4ddd0',
  gray: '#5a6b63',
  mute: '#8a9690',
  white: '#ffffff',
} as const;

const SANS =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";
const SERIF = "Georgia,'Times New Roman',Times,serif";
const MONO = "'SFMono-Regular',Menlo,Consolas,'Courier New',monospace";

/**
 * Nada de lo que entra al HTML lo escribimos nosotros: el nombre, el hotel y
 * las notas los tipea el cliente, asi que todo pasa por aca antes de
 * interpolarse.
 */
export function escapeHtml(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** 1250 -> $1,250.00 */
export function money(amount: number): string {
  return `$${Number(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Las salidas se guardan como instante UTC, asi que formatearlas sin zona
 * horaria daba la hora del servidor: en local (CR) salia bien y en Render
 * (UTC) el comprobante anunciaba la salida 6 horas tarde. Se corre el instante
 * al huso de Costa Rica y se formatea como UTC, igual que toCostaRicaParts,
 * para no depender ni del TZ del proceso ni del ICU de la imagen.
 */
function toCostaRica(value: Date | string): Date {
  return new Date(
    new Date(value).getTime() - CR_UTC_OFFSET_HOURS * 60 * 60 * 1000,
  );
}

export function formatDate(value: Date | string): string {
  return toCostaRica(value).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export function formatTime(value: Date | string): string {
  return toCostaRica(value).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'UTC',
  });
}

/** SHARED -> "Shared shuttle": el enum crudo en mayusculas se leia a sistema. */
export function serviceLabel(type: string): string {
  if (type === 'PRIVATE') return 'Private transfer';
  if (type === 'SHARED') return 'Shared shuttle';
  return type
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/^./, (c) => c.toUpperCase());
}

export function passengerLabel(n: number, infants = 0): string {
  const base = `${n} ${n === 1 ? 'passenger' : 'passengers'}`;
  if (!infants) return base;
  return `${base} + ${infants} ${infants === 1 ? 'infant' : 'infants'} (0–2)`;
}

/** Referencia corta, la misma que el cliente puede dictar por telefono. */
export function bookingRef(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

export interface EmailLeg {
  /** 'OUTBOUND' | 'RETURN' */
  direction: string;
  origin: string;
  destination: string;
  departure: Date | string;
  /** Duracion de la ruta, si se conoce. Solo alimenta el texto del trayecto. */
  durationMin?: number | null;
}

interface LayoutOptions {
  /** Texto de vista previa en la bandeja de entrada; oculto en el cuerpo. */
  preheader: string;
  siteUrl: string;
  /** Sobretitulo dorado del encabezado oscuro */
  eyebrow: string;
  title: string;
  intro: string;
  content: string;
  /** El correo interno no lleva el pie de atencion al cliente */
  audience?: 'customer' | 'admin';
}

/**
 * Punto del itinerario. Va en una tabla propia porque un <div> con
 * border-radius no sobrevive a Outlook; ahi degrada a cuadrito, que sigue
 * leyendose como marca de parada. Ambas paradas van rellenas y se distinguen
 * por color: un circulo con borde se veia cuadrado en cuanto el cliente
 * ignoraba el radio.
 */
function stop(color: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td width="10" height="10" style="width:10px;height:10px;line-height:10px;font-size:0;border-radius:50%;background:${color};">&nbsp;</td></tr></table>`;
}

/** Linea que une las dos paradas */
function connector(): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-left:4px;"><tr><td width="2" height="30" bgcolor="${C.line}" style="width:2px;height:30px;line-height:30px;font-size:0;">&nbsp;</td></tr></table>`;
}

/** 95 -> "1 h 35 min". El tiempo de viaje ya vive en la ruta. */
function duration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m} min`;
  return m ? `${h} h ${m} min` : `${h} h`;
}

/** Tarjeta de un tramo: fecha, hora y el recorrido como linea de tiempo. */
export function itinerary(
  leg: EmailLeg,
  opts: { badge?: string } = {},
): string {
  const badge = opts.badge
    ? `<p style="margin:0 0 12px;font-family:${SANS};font-size:10px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:${C.green};">${escapeHtml(
        opts.badge,
      )}</p>`
    : '';

  const ride = leg.durationMin
    ? `<span style="font-family:${SANS};font-size:12px;color:${C.mute};">About ${escapeHtml(
        duration(leg.durationMin),
      )} on the road</span>`
    : '&nbsp;';

  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.cream};border-radius:14px;">
    <tr><td style="padding:22px 24px;">
      ${badge}
      <p style="margin:0 0 4px;font-family:${SERIF};font-size:19px;line-height:1.3;color:${C.dark};">${escapeHtml(
        formatDate(leg.departure),
      )}</p>
      <p style="margin:0 0 20px;font-family:${SANS};font-size:13px;color:${C.gray};">Departure at <strong style="color:${C.dark};">${escapeHtml(
        formatTime(leg.departure),
      )}</strong></p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td width="22" valign="top" style="width:22px;padding-top:5px;">${stop(C.green)}</td>
          <td valign="top" style="font-family:${SANS};font-size:15px;font-weight:700;color:${C.dark};line-height:1.35;">${escapeHtml(
            leg.origin,
          )}<span style="display:block;font-size:12px;font-weight:400;color:${C.mute};padding-top:2px;">Pick-up</span></td>
        </tr>
        <tr>
          <td width="22" style="width:22px;">${connector()}</td>
          <td valign="middle" style="padding-left:2px;">${ride}</td>
        </tr>
        <tr>
          <td width="22" valign="top" style="width:22px;padding-top:5px;">${stop(C.gold)}</td>
          <td valign="top" style="font-family:${SANS};font-size:15px;font-weight:700;color:${C.dark};line-height:1.35;">${escapeHtml(
            leg.destination,
          )}<span style="display:block;font-size:12px;font-weight:400;color:${C.mute};padding-top:2px;">Drop-off</span></td>
        </tr>
      </table>
    </td></tr>
  </table>`;
}

/**
 * Dato con etiqueta encima, a fila completa. Dos columnas se veian bien en
 * escritorio pero se quiebran en pantallas de 360px, que es donde se abren
 * casi todos estos correos.
 */
export function detail(name: string, value: string, isHtml = false): string {
  return `
  <tr>
    <td style="padding:0 0 4px;font-family:${SANS};font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:${C.mute};font-weight:700;">${escapeHtml(
      name,
    )}</td>
  </tr>
  <tr>
    <td style="padding:0 0 18px;font-family:${SANS};font-size:15px;color:${C.dark};line-height:1.45;">${
      isHtml ? value : escapeHtml(value)
    }</td>
  </tr>`;
}

export function detailsTable(rows: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows}</table>`;
}

export function totalPanel(amount: number, caption: string): string {
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.cream};border-left:3px solid ${C.gold};border-radius:3px 14px 14px 3px;">
    <tr>
      <td style="padding:18px 22px;font-family:${SANS};font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:${C.gray};font-weight:700;">${escapeHtml(
        caption,
      )}</td>
      <td align="right" style="padding:18px 22px;font-family:${SERIF};font-size:27px;color:${C.green};white-space:nowrap;">${money(
        amount,
      )}</td>
    </tr>
  </table>`;
}

/**
 * Boton a prueba de clientes: el color va en el <td> y no en el <a>, porque
 * Outlook no pinta el fondo de un enlace con padding.
 */
export function button(
  href: string,
  text: string,
  variant: 'solid' | 'ghost' = 'solid',
): string {
  const solid = variant === 'solid';
  const bg = solid ? C.green : C.white;
  const fg = solid ? C.white : C.green;
  const border = solid ? C.green : C.line;
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="display:inline-block;margin:0 8px 10px 0;">
    <tr><td align="center" bgcolor="${bg}" style="background:${bg};border-radius:10px;border:1px solid ${border};">
      <a href="${href}" style="display:inline-block;padding:13px 26px;font-family:${SANS};font-size:14px;font-weight:700;color:${fg};text-decoration:none;">${escapeHtml(
        text,
      )}</a>
    </td></tr>
  </table>`;
}

/** Identificadores en monoespaciada: se dictan y se copian, no se leen. */
export function refBlock(items: { name: string; value: string }[]): string {
  const cells = items
    .map(
      (i) => `
      <tr>
        <td style="padding:3px 0;font-family:${SANS};font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:${C.mute};white-space:nowrap;">${escapeHtml(
          i.name,
        )}</td>
        <td align="right" style="padding:3px 0 3px 12px;font-family:${MONO};font-size:12px;color:${C.gray};word-break:break-all;">${escapeHtml(
          i.value,
        )}</td>
      </tr>`,
    )
    .join('');
  // Fondo blanco con borde: pegado al panel crema del total, dos bloques
  // crema seguidos se leian como una sola caja rota.
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.white};border:1px solid ${C.line};border-radius:10px;"><tr><td style="padding:14px 18px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${cells}</table></td></tr></table>`;
}

/** Separador corto en oro: abre cada bloque sin cortar el ancho completo. */
const goldRule = `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td width="32" height="2" bgcolor="${C.gold}" style="width:32px;height:2px;line-height:2px;font-size:0;">&nbsp;</td></tr></table>`;

export function sectionTitle(text: string): string {
  return `${goldRule}<p style="margin:14px 0 16px;font-family:${SANS};font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:${C.gray};font-weight:700;">${escapeHtml(
    text,
  )}</p>`;
}

export function spacer(height: number): string {
  return `<div style="height:${height}px;line-height:${height}px;font-size:0;">&nbsp;</div>`;
}

export function note(text: string): string {
  return `<p style="margin:0;font-family:${SANS};font-size:13px;line-height:1.7;color:${C.gray};">${text}</p>`;
}

export function layout(o: LayoutOptions): string {
  const isAdmin = o.audience === 'admin';
  const waLink = `https://wa.me/${BRAND.whatsapp}`;

  const customerFooter = `
        <p style="margin:0 0 10px;font-family:${SANS};font-size:13px;line-height:1.7;color:${C.gray};">
          Questions about your ride? Message us on
          <a href="${waLink}" style="color:${C.green};font-weight:700;text-decoration:none;">WhatsApp</a>
          or call <a href="tel:${BRAND.phone}" style="color:${C.green};font-weight:700;text-decoration:none;">${BRAND.phone}</a>.
        </p>`;

  const adminFooter = `
        <p style="margin:0 0 10px;font-family:${SANS};font-size:13px;line-height:1.7;color:${C.gray};">
          Automatic notification from the booking system.
        </p>`;

  const domain = o.siteUrl.replace(/^https?:\/\//, '');

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<!-- La paleta es crema: si el cliente la invierte en modo oscuro queda ilegible -->
<meta name="color-scheme" content="light only" />
<meta name="supported-color-schemes" content="light only" />
<title>${escapeHtml(o.title)}</title>
<style>
  body { margin:0 !important; padding:0 !important; width:100% !important; }
  img { border:0; outline:none; text-decoration:none; -ms-interpolation-mode:bicubic; }
  table { border-collapse:collapse !important; }
  a { text-decoration:none; }
  @media only screen and (max-width:620px) {
    .wrap { padding:16px 10px 28px !important; }
    .pad { padding-left:22px !important; padding-right:22px !important; }
    .hero-title { font-size:25px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:${C.page};">
  <div style="display:none;font-size:1px;color:${C.page};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(
    o.preheader,
  )}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.page}" style="background:${C.page};">
    <tr>
      <td align="center" class="wrap" style="padding:32px 16px 40px;">

        <!-- width="600" es para Outlook, que ignora max-width; el resto de los
             clientes usan el 100% y se quedan en 600 como tope -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:${C.white};border:1px solid ${C.line};border-radius:20px;overflow:hidden;">

          <!-- Membrete en blanco: el PNG del sello no tiene transparencia, y
               sobre crema se le notaba el recuadro blanco de fondo -->
          <tr>
            <td align="center" bgcolor="${C.white}" style="background:${C.white};padding:26px 32px 20px;">
              <img src="${o.siteUrl}${BRAND.logoPath}" width="104" height="84" alt="${BRAND.name}" style="display:block;width:104px;height:84px;margin:0 auto 10px;" />
              <p style="margin:0;font-family:${SANS};font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:${C.mute};">Guanacaste, Costa Rica &middot; Since ${BRAND.since}</p>
            </td>
          </tr>

          <!-- Cabecera oscura: el estado del correo se lee de un vistazo -->
          <tr>
            <td class="pad" bgcolor="${C.greenDeep}" style="background:${C.greenDeep};padding:34px 40px;">
              <p style="margin:0 0 12px;font-family:${SANS};font-size:11px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:${C.gold};">${escapeHtml(
                o.eyebrow,
              )}</p>
              <h1 class="hero-title" style="margin:0 0 10px;font-family:${SERIF};font-size:30px;line-height:1.2;font-weight:400;color:${C.white};">${escapeHtml(
                o.title,
              )}</h1>
              <p style="margin:0;font-family:${SANS};font-size:14px;line-height:1.6;color:${C.greenSoft};">${escapeHtml(
                o.intro,
              )}</p>
            </td>
          </tr>

          <tr>
            <td class="pad" style="padding:36px 40px 34px;">${o.content}</td>
          </tr>

          <tr>
            <td class="pad" bgcolor="${C.cream}" style="background:${C.cream};padding:24px 40px 28px;border-top:1px solid ${C.line};">
              ${isAdmin ? adminFooter : customerFooter}
              <p style="margin:0;font-family:${SANS};font-size:11px;line-height:1.7;color:${C.mute};">
                ${BRAND.name} &middot; ${BRAND.tagline}
              </p>
            </td>
          </tr>
        </table>

        <p style="margin:18px 0 0;font-family:${SANS};font-size:11px;color:${C.mute};">
          <a href="${o.siteUrl}" style="color:${C.mute};text-decoration:underline;">${domain}</a>
        </p>

      </td>
    </tr>
  </table>
</body>
</html>`;
}
