# Construye desde la raiz del monorepo: Root Directory = "." y
# Dockerfile Path = "apps/api/Dockerfile" en la config del servicio de Railway.
# Se necesita el repo completo porque apps/api depende del workspace @shuttle/database.

FROM node:20-alpine AS build
WORKDIR /repo

COPY . .
RUN npm ci
RUN npm run db:generate --workspace=packages/database
RUN npm run build --workspace=apps/api

FROM node:20-alpine AS runner
WORKDIR /repo
ENV NODE_ENV=production

COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/apps/api/dist ./apps/api/dist
COPY --from=build /repo/apps/api/package.json ./apps/api/package.json
COPY --from=build /repo/packages/database ./packages/database

EXPOSE 4000

# migrate deploy solo aplica migraciones pendientes: seguro de correr en cada arranque
# se llama al binario directo (no via npx) porque npx no resuelve bien el .bin local aqui
CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy --schema=packages/database/prisma/schema.prisma && node apps/api/dist/main.js"]
