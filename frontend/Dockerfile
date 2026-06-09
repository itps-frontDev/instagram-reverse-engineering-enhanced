# syntax=docker/dockerfile:1

# ─────────────────────────────────────────
# STAGE 1: BASE
# Impostazioni comuni a tutti gli stage.
# Abilitare corepack qui significa che tutti
# gli stage successivi che derivano da base
# avranno già pnpm disponibile.
# ─────────────────────────────────────────
FROM node:22-alpine AS base
RUN corepack enable
ENV NEXT_TELEMETRY_DISABLED=1
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
WORKDIR /app

# ─────────────────────────────────────────
# STAGE 2: DIPENDENZE
# Installa solo le dipendenze npm.
# Separato dal codice per sfruttare la cache Docker:
# se package.json e pnpm-lock.yaml non cambiano,
# pnpm install non viene rieseguito nelle build successive.
# ─────────────────────────────────────────
FROM base AS deps
COPY package.json pnpm-lock.yaml .npmrc ./

RUN corepack prepare pnpm@11.5.2 --activate
RUN pnpm install --frozen-lockfile --ignore-scripts
RUN pnpm rebuild esbuild sharp unrs-resolver

# ─────────────────────────────────────────
# STAGE 3: BUILD
# Compila Next.js in modalità produzione.
# ─────────────────────────────────────────
FROM base AS builder
RUN corepack prepare pnpm@10.7.0 --activate
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build
# Produce .next/standalone/ grazie a output: 'standalone'
# in next.config.js — una cartella autosufficiente con solo
# i file necessari per girare in produzione.
# Riduce l'immagine finale da ~1GB a ~150MB.

# ─────────────────────────────────────────
# STAGE 4: RUNNER
# Immagine finale leggera — solo i file necessari
# per eseguire l'app, niente sorgenti né node_modules.
# Non serve pnpm qui: l'app gira con solo Node.
# ─────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Utente non-root per sicurezza.
# Di default Docker gira come root — se il container
# venisse compromesso, l'attaccante avrebbe i permessi
# root. Con un utente dedicato il danno è limitato.
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copia i file pubblici statici
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copia l'output standalone di Next.js.
# --chown: assegna i file all'utente nextjs, non root.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# server.js è il punto di ingresso generato da Next.js
# nella modalità standalone — non è un file che crei tu.
CMD ["node", "server.js"]