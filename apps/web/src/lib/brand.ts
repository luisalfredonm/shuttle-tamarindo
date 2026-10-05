/** Datos de marca en un solo lugar, para que no se desincronicen entre vistas. */

export const BRAND_NAME = "Retana Transfers Tamarindo";

/**
 * Nombre anterior (hasta octubre de 2026). Va como alternateName en el schema
 * para que Google y los buscadores con IA traten las menciones viejas (perfiles,
 * directorios, correos ya enviados) como la misma empresa y no como otra.
 */
export const BRAND_FORMER_NAME = "Retana Services Tamarindo";

/**
 * URL base del sitio, fuente única.
 *
 * Antes vivía duplicada como BASE_URL en layout, sitemap, robots, el schema y
 * las landings de ruta: cada cambio de dominio se olvidaba en alguno y quedaban
 * canonical/OG/sitemap apuntando a distintos lados. El fallback es el dominio
 * real del cliente (retanatransfers.com; el anterior se dio de baja sin
 * redirección). shuttletamarindo.com es de un tercero y está en parking, así
 * que apuntarle era regalarle señales. En producción lo pisa
 * NEXT_PUBLIC_SITE_URL.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://retanatransfers.com";

/** Sello circular con interior blanco; transparente fuera del anillo. */
export const BRAND_LOGO = "/logo-retana-transfers-tamarindo.png";

/** Del propio logo ("since 2015"). Alimenta foundingDate en el schema. */
export const BRAND_FOUNDED = "2015";

/** Foto propia del servicio. Respaldo de las rutas que aun no tienen la suya. */
export const BRAND_HERO_IMAGE = "/hero-shuttle-tamarindo-sunset.jpg";

/**
 * Teléfono de contacto en E.164, fuente única.
 *
 * BRAND_PHONE (con +) va en el schema y en enlaces tel:. BRAND_WHATSAPP son
 * los mismos dígitos sin signos, como los pide wa.me. Antes el número vivía
 * hardcodeado y con un placeholder (50688888888) en footer, cuenta y éxito de
 * reserva: los clientes escribían a un número que no existe.
 */
export const BRAND_PHONE = "+50683183226";
export const BRAND_WHATSAPP = "50683183226";

/** Autor de los artículos del blog. Alimenta el byline visible y el schema
 *  Person (E-E-A-T: Google valora una identidad de autor real y consistente). */
export const BRAND_AUTHOR = "Christian Retana";
