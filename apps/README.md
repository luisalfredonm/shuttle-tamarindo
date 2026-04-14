# Shuttle Tamarindo

Plataforma de reservas de shuttles y transfers en Guanacaste, Costa Rica.

## Stack

- **Frontend:** Next.js 14 (App Router) + Tailwind CSS
- **Backend:** NestJS + Prisma
- **Base de datos:** PostgreSQL
- **Pagos:** BAC Credomatic (simulado en desarrollo)
- **Hosting:** Contabo

## Estructura

## Requisitos

- Node.js >= 20
- PostgreSQL >= 15
- npm >= 10

## Instalación local

```bash
# 1. Clonar el repo
git clone https://github.com/tu-usuario/shuttle-tamarindo.git
cd shuttle-tamarindo

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
cp apps/admin/.env.example apps/admin/.env.local
cp packages/database/.env.example packages/database/.env

# 4. Editar cada .env con tus credenciales reales

# 5. Crear la base de datos
createdb shuttle_tamarindo_dev

# 6. Correr migraciones
cd packages/database
npx prisma migrate dev
npx prisma generate
cd ../..

# 7. Seed de datos iniciales
# Con el API corriendo:
curl -X POST http://localhost:4000/api/routes/seed
curl -X POST http://localhost:4000/api/trips/seed
```

## Levantar en desarrollo

```bash
# Terminal 1 — API
cd apps/api && npm run start:dev

# Terminal 2 — Web
cd apps/web && npm run dev

# Terminal 3 — Admin
cd apps/admin && npm run dev -- --port 3001
```

## URLs locales

| App           | URL                       |
| ------------- | ------------------------- |
| Web           | http://localhost:3000     |
| API           | http://localhost:4000/api |
| Admin         | http://localhost:3001     |
| Prisma Studio | http://localhost:5555     |

## Variables de entorno

Copia los archivos `.env.example` y completa con tus credenciales. **Nunca subas archivos `.env` al repositorio.**
