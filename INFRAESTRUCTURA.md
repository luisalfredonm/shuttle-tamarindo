# Infraestructura — Retana Services Tamarindo

Dónde vive cada pieza del sistema, qué variable la conecta con la siguiente y
qué falta por hacer. Última revisión: **15 de septiembre de 2026**.

> Este archivo se actualiza a mano. Si cambias un proveedor, un dominio o una
> variable, edítalo en el mismo commit.

---

## Mapa del sistema

```
Cliente (navegador)
   │
   ├── retanaservices.com ──────────► Vercel · proyecto shuttle-tamarindo-web
   │                                    (sitio público: rutas, reservas, pago)
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
                                            ├──► PayPal (cobros)
                                            └──► Resend (correos)
```

## Servicios y cuentas

| Pieza | Proveedor | Identificador | Plan |
|---|---|---|---|
| Web pública | Vercel | `shuttle-tamarindo-web` | Hobby ⚠️ |
| Panel admin | Vercel | `shuttle-tamarindo-admin` | Hobby ⚠️ |
| API | Render | `shuttle-tamarindo` → `shuttle-tamarindo.onrender.com` | Free ⚠️ |
| Base de datos | Neon | proyecto `shuttle-tamarindo`, rama `production`, región `us-east-2` | Free ⚠️ |
| Correos | Resend | cuenta 321 Solutions | Free (1 dominio) |
| Pagos | PayPal | modo **sandbox** | — |
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

Al panel **no se llega desde la web**: no hay enlace, a propósito. Se entra
escribiendo la dirección y con un usuario de rol `ADMIN`.

## DNS (GoDaddy)

| Tipo | Nombre | Valor | Apunta a |
|---|---|---|---|
| A | `@` | `216.198.79.1` | Vercel (web) |
| CNAME | `www` | `cname.vercel-dns.com` | Vercel (web) |
| CNAME | `admin` | el que da Vercel (`*.vercel-dns-017.com`) | Vercel (admin) |
| CNAME | `api` | `shuttle-tamarindo.onrender.com` | Render |

Los certificados HTTPS los emiten Vercel y Render solos. Cuando se agregue
Resend habrá tres registros más (DKIM, SPF y un MX en el subdominio `send`).

## Variables de entorno

### Render (la API) — es donde viven todos los secretos

| Variable | Para qué |
|---|---|
| `DATABASE_URL` | Conexión a Neon |
| `JWT_SECRET` | Firma de sesiones. Si cambia, se cierran todas |
| `CORS_ORIGINS` | Dominios que pueden llamar a la API. Sin esto la web queda bloqueada |
| `PAYPAL_MODE` | `sandbox` o `live` |
| `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` | Credenciales de la cuenta que cobra |
| `PAYPAL_WEBHOOK_ID` | Sin esto la API rechaza los avisos de PayPal |
| `RESEND_API_KEY` | Envío de correos |
| `EMAIL_FROM` | Remitente. Hoy `onboarding@resend.dev` (solo entrega al dueño de la cuenta Resend) |
| `SITE_URL` | A dónde llevan los botones de los correos |
| `ADMIN_EMAIL` / `ADMIN_NAME` / `ADMIN_PHONE` | Destinatario del aviso de reserva nueva |
| `PORT` | Puerto del proceso |

### Vercel (web y admin)

| Variable | Valor | Tipo |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `https://api.retanaservices.com/api` | **Config**, nunca Secret |
| `NEXT_PUBLIC_SITE_URL` | `https://retanaservices.com` | **Config** |
| `API_URL` (solo admin, opcional) | igual que el anterior | Config |
| `NEXT_PUBLIC_GA_ID` | pendiente: hoy es el valor de ejemplo | Config |

Las `NEXT_PUBLIC_*` se compilan dentro del JavaScript del navegador: **son
públicas por naturaleza**. Marcarlas como *Secret* en Vercel no las esconde y
además impide volver a leerlas. Después de cambiarlas hay que hacer
**Redeploy**, o el sitio sigue usando los valores viejos.

## Despliegue

Todo sale de la rama `master` en GitHub. Un `git push` dispara los tres:

| Servicio | Qué hace al desplegar |
|---|---|
| Vercel (web y admin) | Compila e publica |
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

Los métodos se prenden y apagan desde el panel → **Payments**. Los secretos no
se editan ahí: viven solo en Render.

## Tareas programadas

`@Cron('0 9 * * *')` en
[trip-generation.task.ts](apps/api/src/schedules/trip-generation.task.ts) —
3:00 AM de Costa Rica. Mantiene 60 días de salidas generadas a partir de los
horarios. **Requiere que el API esté despierto a esa hora**, cosa que el plan
Free de Render no garantiza.

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
| 1 | **PayPal a `live`** | Hoy los cobros son de prueba: no entra dinero |
| 2 | **Webhook de PayPal** | Sin él, un cliente puede pagar y quedarse sin reserva confirmada |
| 3 | **Verificar el dominio en Resend** | Mientras no esté, los clientes **no reciben** sus correos |
| 4 | **Render Starter (~$7/mes)** | En Free el API se duerme: pagos demorados, clientes que abandonan y el cron de las 3 AM que no corre |
| 5 | **Vercel Pro ($20/mes)** | El plan Hobby **no permite uso comercial**: riesgo de suspensión |
| 6 | **Plan de pago en la base, o respaldos periódicos** | Neon Free solo guarda 6 h de historial |
| 7 | Cargar el resto de rutas en producción | Solo hay 1 ruta cargada |
| 8 | `NEXT_PUBLIC_GA_ID` real | Hoy es un valor de ejemplo: no se miden visitas |
| 9 | Mover `ADMIN_*` a la base | La pantalla Profile del panel escribe en un archivo del servidor y Render lo borra en cada deploy |

### Evaluado y descartado por ahora

- **Mover el API a Vercel:** técnicamente posible, pero obliga a rehacer el
  cron, las migraciones y el manejo de conexiones de Prisma. Ahorra ~$7/mes y
  arriesga el cobro. Revisarlo cuando haya menos frentes abiertos.
- **Migrar la base a Supabase:** no aporta nada hoy. El sistema no usa ninguna
  función propia de Supabase, y su plan Free tiene menos respaldo que Neon.
- **Cambiar la región del API:** se midió la latencia a la base (3–4 ms): API y
  base ya están cerca. No tocar.
