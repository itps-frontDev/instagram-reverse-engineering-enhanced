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
# La cache mount di BuildKit conserva lo store pnpm tra una build e l'altra:
# i pacchetti si scaricano solo la prima volta, anche se il layer è invalidato.
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts
RUN pnpm rebuild esbuild sharp unrs-resolver

# ─────────────────────────────────────────
# STAGE 3: BUILD
# Compila Next.js in modalità produzione.
# ─────────────────────────────────────────
FROM base AS builder
RUN corepack prepare pnpm@11.5.2 --activate

# ATTENZIONE: le variabili NEXT_PUBLIC_* vengono INLINATE NEL BUNDLE QUI,
# durante `pnpm build` — impostarle a runtime nel compose NON ha effetto
# sul codice client. Per un dominio diverso vanno passate come build args:
# docker build --build-arg NEXT_PUBLIC_WS_URL=... .
# I default puntano alla VM demo su Azure: un build senza argomenti produce
# l'immagine pronta per il deploy. (Lo sviluppo locale non passa da qui:
# usa Dockerfile.dev + next dev, che legge le env del compose a runtime.)
ARG NEXT_PUBLIC_API_URL=http://instagram-demo.spaincentral.cloudapp.azure.com:8080
ARG NEXT_PUBLIC_WS_URL=http://instagram-demo.spaincentral.cloudapp.azure.com:8080/ws
ARG NEXT_PUBLIC_BASE_URL=http://instagram-demo.spaincentral.cloudapp.azure.com:3000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL

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