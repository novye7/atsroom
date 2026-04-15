# Stage 1: Install dependencies
FROM node:22-bookworm-slim AS deps

RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/ui/package.json packages/ui/
COPY apps/server/package.json apps/server/

RUN npm ci

# Stage 2: Build
FROM node:22-bookworm-slim AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/ui/node_modules ./packages/ui/node_modules
COPY --from=deps /app/apps/server/node_modules ./apps/server/node_modules

COPY packages/ui ./packages/ui
COPY apps/server ./apps/server
COPY package.json package-lock.json ./

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build:server

# Stage 3: Production
FROM node:22-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN groupadd --gid 1001 nodejs && \
    useradd --uid 1001 --gid nodejs nextjs

COPY --from=builder /app/apps/server/.next/standalone ./
COPY --from=builder /app/apps/server/.next/static ./apps/server/.next/static
COPY --from=builder /app/apps/server/public ./apps/server/public

RUN mkdir -p /app/data && chown nextjs:nodejs /app/data

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/server/server.js"]
