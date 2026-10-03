# Infraestructura — Retana Services Tamarindo

Dónde vive cada pieza del sistema, qué variable la conecta con la siguiente y
qué falta por hacer. Última revisión: **2 de octubre de 2026**.

> Este archivo se actualiza a mano. Si cambias un proveedor, un dominio o una
> variable, edítalo en el mismo commit.

---

## 🚧 Cambio a Retana Transfers Tamarindo · retanatransfers.com (en curso)

Decisión del cliente (octubre de 2026): cambian **la marca** ("Retana Services
Tamarindo" → "Retana Transfers Tamarindo") **y el dominio**
(`retanaservices.com` → `retanatransfers.com`). Todo lo demás de este archivo
describe lo que estaba en producción con el dominio viejo. Al terminar la
migración, actualizar el archivo entero y borrar esta sección.

`retanatransfers.com` se compró el 02/10/2026 en GoDaddy (vence en octubre de
2027, con DNS en GoDaddy).

**`retanaservices.com` se da de baja sin redirección** (decisión de Luis,
03/10/2026: el sitio es nuevo y no se quiere conservar). Consecuencia aceptada:
los enlaces de los correos ya enviados y las URLs viejas que tenga Google dejan
de funcionar, y no se usa el Cambio de dirección de Search Console. El registro
del dominio conviene renovarlo igual aunque no apunte a nada, para que nadie
más lo compre con el nombre "Retana".

### Fase 0 — Decisiones
- [x] Comprar `retanatransfers.com`
- [x] Confirmar que cambia también la marca
- [ ] Renovación automática en los dos dominios
- [ ] **Logo nuevo**: el actual tiene "Retana Services" dentro de la imagen.
  Hacen falta el sello grande (hoy 1320×1065), la versión de 180 px del panel y
  los íconos de 192 y 512 px (web y admin). Ideal: el original en SVG

### Fase 1 — Preparar sin tocar producción
- [x] Vercel web: agregar `retanatransfers.com` y `www.retanatransfers.com` (sin hacerlo principal) — comprobado 02/10: 200 y `www` → 308
- [x] Vercel admin: agregar `admin.retanatransfers.com` — comprobado 02/10
- [x] Render: agregar `api.retanatransfers.com` como dominio adicional — verificado 02/10, `/api/health` responde con HTTPS válido
- [x] DNS del dominio nuevo: A `@` → `216.198.79.1`, CNAME `www` → `retanatransfers.com.`, `admin` → `c2cbd40923068bcf.vercel-dns-017.com`, `api` → `shuttle-tamarindo.onrender.com`
- [x] Resend: agregar el dominio nuevo y sus DNS. En el plan Free hay que quitar el viejo — DNS comprobados 02/10 (DKIM y `send`). Si se quitó el viejo, `EMAIL_FROM` tiene que pasar ya a `@retanatransfers.com`
- [x] Turnstile: agregar `retanatransfers.com` a los hostnames del widget, sin quitar el viejo — hecho según Luis; se prueba en la fase 3
- [x] Render `CORS_ORIGINS`: **sumar** los 3 orígenes nuevos sin quitar los viejos. Separados solo por comas, **sin espacios**: el código no los recorta — comprobado 02/10: web y `www` permitidos; `admin.retanatransfers.com` no lo toma (sin efecto práctico, el panel usa proxy de servidor; revisar si quedó un espacio o `/` al final)
- [ ] Buzón `reservas@retanatransfers.com` (es el correo de soporte que muestra el sitio) — creado, pero al 02/10 el dominio **no tiene registros MX**: no recibe correo
- [ ] Search Console: propiedad de dominio `retanatransfers.com`, verificada por DNS — creada; al 02/10 no hay TXT `google-site-verification` ni meta tag, confirmar que diga verificada
- [ ] Comprobar: `https://api.retanatransfers.com/api/health` responde y `retanatransfers.com` abre el sitio

### Fase 2 — El cambio
- [ ] Logo nuevo en el repo (renombrar `logo-retana-services-tamarindo.png` y actualizar `BRAND_LOGO`, `ADMIN_ICON` y `BRAND.logoPath`)
- [x] Commit y push del código — `9262348`, 02/10 (logo viejo provisional)
- [x] Vercel web y admin: `NEXT_PUBLIC_SITE_URL=https://retanatransfers.com` y `NEXT_PUBLIC_API_URL=https://api.retanatransfers.com/api` (admin: también `API_URL`), y **Redeploy** — comprobado: canonical, og:url, sitemap y preconnect ya usan el dominio nuevo
- [ ] Render: `SITE_URL=https://retanatransfers.com` y `EMAIL_FROM=reservas@retanatransfers.com`

### Fase 3 — Dar de baja `retanaservices.com` (en este orden)
- [ ] Confirmar en Vercel admin que `NEXT_PUBLIC_API_URL` (y `API_URL` si existe) ya dicen `api.retanatransfers.com`: el proxy del panel deja de funcionar si todavía usa el API viejo
- [ ] Render `CORS_ORIGINS` solo con `https://retanatransfers.com,https://www.retanatransfers.com,https://admin.retanatransfers.com`
- [ ] Vercel web: quitar `retanaservices.com` y `www.retanaservices.com`
- [ ] Vercel admin: quitar `admin.retanaservices.com`
- [ ] Render: quitar `api.retanaservices.com` de Custom Domains
- [ ] Turnstile: quitar `retanaservices.com` de los hostnames
- [ ] Resend: quitar `retanaservices.com` si sigue
- [ ] GoDaddy, DNS de `retanaservices.com`: borrar A `@`, CNAME `www`, `admin` y `api`, y los de Resend (`resend._domainkey`, `send`)
- [ ] Search Console, propiedad vieja: Removals → "Remove all URLs with this prefix" → `https://retanaservices.com/`, para que deje de salir en Google ya y no en semanas

### Fase 4 — Verificar
- [ ] `retanaservices.com` ya no abre nada
- [ ] Canonical, `og:url`, schema, `sitemap.xml`, `robots.txt` y `llms.txt` con el dominio nuevo
- [ ] Reserva sin cuenta (captcha) y correo recibido
- [ ] Cobro real (con PayPal, 03/10)

### Fase 5 — SEO y perfiles
- [ ] Search Console: verificar la propiedad nueva y enviar `https://retanatransfers.com/sitemap.xml`
- [ ] PayPal: webhook live en `https://api.retanatransfers.com/api/payments/webhook/paypal` (pendiente #1)
- [ ] Google Business Profile, WhatsApp Business, redes y directorios con la marca y la web nuevas
- [ ] Reescribir este archivo con el dominio nuevo y borrar esta sección

---

## Mapa del sistema

```
Cliente (navegador)
   │
   ├── retanaservices.com ──────────► Vercel · proyecto shuttle-tamarindo-web
   │                                    (sitio público: rutas, reservas, pago)
   │                                    captcha Turnstile en el checkout sin cuenta
   │
   ├── admin.retanaservices.com ────► Vercel · proyecto shuttle-tamarindo-admin
   │                                    (panel interno, solo rol ADMIN)
   │                                    llama a la API por su propio proxy
   │                                    /api/proxy/... del lado del servidor
   │
   └── api.retanaservices.com ──────► Render · servicio shuttle-tamarindo
                                        (NestJS + Prisma, Docker)
                                            │
                                            ├──► Neon · PostgreSQL
                                            ├──► PayPal (cobros, modo live)
                                            ├──► Resend (correos)
                                            ├──► Vercel Blob (fotos de las rutas)
                                            └──► Cloudflare Turnstile (valida el captcha)
```

## Servicios y cuentas

| Pieza | Proveedor | Identificador | Plan |
|---|---|---|---|
| Web pública | Vercel | `shuttle-tamarindo-web` | Hobby ⚠️ |
| Panel admin | Vercel | `shuttle-tamarindo-admin` | Hobby ⚠️ |
| API | Render | `shuttle-tamarindo` → `shuttle-tamarindo.onrender.com` | Free ⚠️ |
| Base de datos | Neon | proyecto `shuttle-tamarindo`, rama `production`, región `us-east-2` | Free ⚠️ |
| Correos | Resend | cuenta 321 Solutions | Free (1 dominio) |
| Pagos | PayPal | modo **live** desde el 22/09/2026 | — |
| Fotos de rutas | Vercel Blob | store **Public** | — |
| Anti-bots | Cloudflare Turnstile | llave de sitio + llave secreta | Free |
| Buscadores | Google Search Console | propiedad `retanaservices.com` | — |
| Dominio | GoDaddy | `retanaservices.com`, comprado el 15/09/2026 | — |
| Código | GitHub | `luisalfredonm/shuttle-tamarindo`, rama `master` | — |

Los ⚠️ están explicados en [Pendientes](#pendientes).

`shuttletamarindo.com` **no es nuestro**: está registrado por un tercero y en
parking. Si aparece en algún lado del código, es un resto viejo y hay que
cambiarlo por `retanaservices.com`.

## URLs

| Para | URL |
|---|---|
| Sitio público | https://retanaservices.com (`www` redirige aquí con 308) |
| Panel admin | https://admin.retanaservices.com |
| API | https://api.retanaservices.com/api |
| Salud del API | https://api.retanaservices.com/api/health |
| Webhook de PayPal | https://api.retanaservices.com/api/payments/webhook/paypal |
| Sitemap | https://retanaservices.com/sitemap.xml (enviado a Search Console el 26/09/2026) |

Al panel **no se llega desde la web**: no hay enlace, a propósito. Se entra
escribiendo la dirección y con un usuario de rol `ADMIN`.

## DNS (GoDaddy)

| Tipo | Nombre | Valor | Apunta a |
|---|---|---|---|
| A | `@` | `216.198.79.1` | Vercel (web) |
| CNAME | `www` | `cname.vercel-dns.com` | Vercel (web) |
| CNAME | `admin` | el que da Vercel (`*.vercel-dns-017.com`) | Vercel (admin) |
| CNAME | `api` | `shuttle-tamarindo.onrender.com` | Render |
| TXT | `resend._domainkey` | llave DKIM de Resend | Resend |
| MX + TXT (SPF) | `send` | los que da Resend | Resend |
| TXT | `_dmarc` | `v=DMARC1; p=quarantine; ...` | política de correo |

Los certificados HTTPS los emiten Vercel y Render solos. Los registros de
Resend ya están publicados (comprobado el 02/10/2026); falta confirmar en
Resend → Domains que el dominio diga **Verified**.

## Variables de entorno

### Render (la API) — es donde viven todos los secretos

| Variable | Para qué |
|---|---|
| `DATABASE_URL` | Conexión a Neon |
| `JWT_SECRET` | Firma de sesiones. Si cambia, se cierran todas. Sin ella la API no arranca |
| `CORS_ORIGINS` | Dominios que pueden llamar a la API. Sin esto la web queda bloqueada |
| `PAYPAL_MODE` | `sandbox` o `live`. Se compara exacto contra `live` en minúscula |
| `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` | Credenciales de la cuenta que cobra |
| `PAYPAL_WEBHOOK_ID` | Id del webhook de la app **live**. Sin el correcto la API rechaza los avisos de PayPal |
| `RESEND_API_KEY` | Envío de correos |
| `EMAIL_FROM` | Remitente. Debe ser una dirección `@retanaservices.com` (p. ej. `reservas@`); con `onboarding@resend.dev` solo le llega al dueño de la cuenta Resend |
| `SITE_URL` | A dónde llevan los botones de los correos |
| `TURNSTILE_SECRET_KEY` | Valida el captcha del checkout sin cuenta. Vacía = no se pide captcha |
| `BLOB_READ_WRITE_TOKEN` | Subir fotos de rutas desde el panel. Sin ella las rutas usan la foto general |
| `ADMIN_EMAIL` / `ADMIN_NAME` / `ADMIN_PHONE` | Destinatario del aviso de reserva nueva |
| `PORT` | Puerto del proceso |

`PAYMENT_MODE` también está cargada en Render y en `apps/api/.env`, pero
**ningún archivo del repo la lee**: el modo lo decide `PAYPAL_MODE`. Se puede
borrar.

### Vercel (web y admin)

| Variable | Proyecto | Valor | Tipo |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | web y admin | `https://api.retanaservices.com/api` | **Config**, nunca Secret |
| `NEXT_PUBLIC_SITE_URL` | web y admin | `https://retanaservices.com` (en el admin es el link "View website") | **Config** |
| `API_URL` | admin, opcional | igual que `NEXT_PUBLIC_API_URL` | Config |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | web | llave de sitio de Turnstile | Config |
| `NEXT_PUBLIC_GOOGLE_VERIFICATION` | web | código de verificación de Search Console | Config |
| `NEXT_PUBLIC_GA_ID` | web | pendiente: hoy es el valor de ejemplo `G-XXXXXXXXXX` | Config |

Las `NEXT_PUBLIC_*` se compilan dentro del JavaScript del navegador: **son
públicas por naturaleza**. Marcarlas como *Secret* en Vercel no las esconde y
además impide volver a leerlas. Después de cambiarlas hay que hacer
**Redeploy**, o el sitio sigue usando los valores viejos.

En Vercel mandan las variables del proyecto. El archivo
`apps/web/.env.production` todavía apunta a `shuttletamarindo.com`: solo afecta
a un build local, pero ese build sale contra un API que no existe.

## Despliegue

Todo sale de la rama `master` en GitHub. Un `git push` dispara los tres:

| Servicio | Qué hace al desplegar |
|---|---|
| Vercel (web y admin) | Compila y publica |
| Render (API) | Construye [apps/api/Dockerfile](apps/api/Dockerfile) y, al arrancar, corre `prisma migrate deploy` |

Las migraciones de Prisma se aplican solas en cada arranque del API. Crear una
migración nueva sigue siendo manual: `npm run db:migrate` en local.

## Correos que envía el sistema

| Correo | Cuándo | A quién |
|---|---|---|
| Bienvenida | Al registrarse | Al cliente |
| Confirmación de reserva | Cuando el pago se captura | Al cliente |
| Aviso de reserva nueva | Cuando el pago se captura | A `ADMIN_EMAIL` |

Si falla un envío **la reserva no se rompe**: el error queda en los logs de
Render. Por eso conviene revisar Resend → Emails cuando se sospeche algo.

## Flujo de un pago

1. La web pide `GET /payments/methods` y, si PayPal está activo, carga su SDK
   con el `clientId` público.
2. `POST /payments/order` — **el importe lo pone el servidor** desde la base,
   nunca el navegador.
3. El cliente aprueba en PayPal.
4. `POST /payments/capture` — el servidor cobra, verifica que el monto coincida
   y confirma la reserva.
5. Respaldo: el webhook `PAYMENT.CAPTURE.COMPLETED` confirma la reserva si el
   paso 4 nunca llegó (el cliente cerró la ventana, se cayó la conexión).

**Los reembolsos no se sincronizan.** El webhook ignora todo evento que no sea
`PAYMENT.CAPTURE.COMPLETED` ([payments.service.ts](apps/api/src/payments/payments.service.ts)),
así que un reembolso hecho desde PayPal no cambia la reserva en la base: queda
como pagada y hay que corregirla a mano.

Los métodos se prenden y apagan desde el panel → **Payments**. Los secretos no
se editan ahí: viven solo en Render.

Se puede reservar **sin crear cuenta**. En ese caso la web pide el captcha de
Turnstile y la API lo valida antes de crear la reserva. El cliente recupera su
reserva después con su correo ("Find my booking").

## Fotos de las rutas

Se suben desde el panel → **Routes** y quedan en Vercel Blob (store público),
en `routes/<nombre>.jpg`. La API guarda la URL en la ruta. Si la ruta no tiene
foto, la web muestra la foto general.

## Tareas programadas

`@Cron('0 9 * * *')` en
[trip-generation.task.ts](apps/api/src/schedules/trip-generation.task.ts) —
3:00 AM de Costa Rica. Mantiene 60 días de salidas generadas a partir de los
horarios. **Requiere que el API esté despierto a esa hora**, cosa que el plan
Free de Render no garantiza: el 02/10/2026 a las 8:30 AM el API llevaba apenas
5 minutos encendido sin que hubiera deploy nuevo, o sea que estaba dormido.

## Respaldos

Neon Free solo guarda 6 horas de historial. Hasta que haya plan de pago, el
respaldo es manual:

```bash
pg_dump "$DATABASE_URL_DE_NEON" -f backup-neon-AAAAMMDD.sql
```

`pg_dump` viene con PostgreSQL (`C:\Program Files\PostgreSQL\18\bin`).

---

## Pendientes

Ordenados por lo que cuesta si no se hace.

| # | Pendiente | Por qué importa |
|---|---|---|
| 1 | **`PAYPAL_WEBHOOK_ID` de la app live en Render** | El de sandbox no sirve. Sin el correcto se rechazan todos los avisos: un cliente que cierra la ventana puede pagar y quedarse sin reserva confirmada. Crearlo ya con la URL de `api.retanatransfers.com`, evento `PAYMENT.CAPTURE.COMPLETED` |
| 2 | **Prueba real de punta a punta en live** | Un cobro chico para confirmar pago, correos y webhook con dinero de verdad. Reembolsarlo desde PayPal y corregir la reserva a mano (ver siguiente) |
| 2b | Sincronizar reembolsos (`PAYMENT.CAPTURE.REFUNDED`) | Hoy un reembolso hecho en PayPal deja la reserva como pagada en la base y en el panel |
| 3 | **Confirmar el dominio en Resend** | Los DNS ya están; falta ver **Verified** en Resend y que `EMAIL_FROM` use `@retanaservices.com`. Si no, los clientes **no reciben** sus correos |
| 4 | **Render Starter (~$7/mes)** | En Free el API se duerme: pagos demorados, clientes que abandonan y el cron de las 3 AM que no corre |
| 5 | **Vercel Pro ($20/mes)** | El plan Hobby **no permite uso comercial**: riesgo de suspensión |
| 6 | **Plan de pago en la base, o respaldos periódicos** | Neon Free solo guarda 6 h de historial |
| 7 | Revisar las rutas cargadas | Hay 4. `lib-tama` repite Liberia Airport → Tamarindo y no tiene foto (parece de prueba). `tamarindo-avellanas` cobra $50 privado y $180 round trip. Falta cargar el resto |
| 8 | `NEXT_PUBLIC_GA_ID` real | Hoy es un valor de ejemplo: no se miden visitas |
| 9 | Corregir `apps/web/.env.production` | Apunta a `shuttletamarindo.com`, que no es nuestro |
| 10 | Borrar `PAYMENT_MODE` de Render y de `apps/api/.env` | No la lee nada y confunde con `PAYPAL_MODE` |
| 11 | Mover `ADMIN_*` a la base | La pantalla Profile del panel escribe en un archivo del servidor y Render lo borra en cada deploy |

## Historial

| Fecha | Qué |
|---|---|
| 15/09/2026 | Compra de `retanaservices.com` y web conectada en Vercel |
| 17/09/2026 | Subdominios `admin.` y `api.` conectados; Vercel Blob y Turnstile activos |
| 22/09/2026 | PayPal pasa a **live** |
| 26/09/2026 | Propiedad en Search Console y sitemap enviado |
| 02/10/2026 | Revisión: los registros DNS de Resend ya están publicados (sin fecha exacta de alta) |

### Evaluado y descartado por ahora

- **Mover el API a Vercel:** técnicamente posible, pero obliga a rehacer el
  cron, las migraciones y el manejo de conexiones de Prisma. Ahorra ~$7/mes y
  arriesga el cobro. Revisarlo cuando haya menos frentes abiertos.
- **Migrar la base a Supabase:** no aporta nada hoy. El sistema no usa ninguna
  función propia de Supabase, y su plan Free tiene menos respaldo que Neon.
- **Cambiar la región del API:** se midió la latencia a la base (3–4 ms): API y
  base ya están cerca. No tocar.
