# Piano di integrazione — Frontend Next.js nel monorepo

## Contesto

Il progetto attuale (`_fatellisync`) è un monorepo con:
- `backend/` — Spring Boot 4 / Java 26, Gradle, PostgreSQL + Liquibase, Redis, Docker Compose
- `specs/` — documentazione

Il frontend esistente (`fatellisync-fe`) è una web app Next.js 16 / React 19 con pattern BFF: alcune API vengono proxate verso Spring Boot, altre accedono direttamente al DB via Prisma.

Obiettivo: spostare il frontend in `frontend/` nel monorepo e allinearlo alle convenzioni di progetto (env, docker-compose, .gitignore, URL configurabili).

---

## Fase 1 — Copia dei file

1. Copia **tutto il contenuto** di `C:\Users\utente4\Documents\fatellisync-fe` nella cartella `frontend/` del monorepo.
   - Escludi: `node_modules/`, `.next/`, qualsiasi file `.env*` (verranno ricreati al punto successivo).
   - Rinomina il campo `"name"` in `frontend/package.json` da `"fatellisync-fe"` a `"fatellisync-fe"` → `"@fatellisync/frontend"`.

2. Verifica che la struttura risultante sia:
   ```
   _fatellisync/
   ├── backend/
   ├── frontend/
   │   ├── src/
   │   ├── package.json
   │   ├── next.config.ts
   │   ├── tsconfig.json
   │   └── ...
   ├── specs/
   ├── docker-compose.yml
   └── .gitignore
   ```

---

## Fase 2 — Fix URL hardcoded

### 2a. Image route proxy

**File:** `frontend/src/app/api/products/[sku]/image/route.ts`

L'URL del backend Spring è attualmente hardcoded. Sostituirlo con la variabile d'ambiente `SPRING_API_BASE_URL`:

```ts
// prima
const url = `https://api.fatellicaterinasrl.com:5050/images/product/${sku}`;

// dopo
const springBase = process.env.SPRING_API_BASE_URL;
const url = `${springBase}/images/product/${sku}`;
```

Verifica che `SPRING_API_BASE_URL` sia già usato in `src/lib/auth/backend.ts` — confermato, stessa variabile, nessuna duplicazione da introdurre.

---

## Fase 3 — File `.env` del frontend

Crea `frontend/.env.example` (template pubblico, nessun valore reale):

```env
# ============================================================
# Database — PostgreSQL
# ============================================================
DB_HOST=
DB_PORT=5432
DB_NAME=
DB_USER=
DB_PASSWORD=
DB_SCHEMA=
DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<dbname>?schema=<schema>

# ============================================================
# App
# ============================================================
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ============================================================
# Logging
# ============================================================
LOG_PRETTY=false
LOG_LEVEL=info

# ============================================================
# Spring Boot API
# ============================================================
SPRING_API_BASE_URL=https://api.fatellicaterinasrl.com:5050

# ============================================================
# Auth bypass (solo sviluppo locale — mai in produzione)
# ============================================================
AUTH_BYPASS=false

# ============================================================
# Dev origins aggiuntivi (opzionale)
# ============================================================
NEXT_ALLOWED_DEV_ORIGINS=
```

Crea `frontend/.env.local` (non committato) copiando i valori reali dall'originale `fatellisync-fe/.env.local`.

---

## Fase 4 — Aggiornamento `.gitignore` root

Il `.gitignore` root attuale copre già `.env` e `.env.dev`. Aggiungi le pattern specifiche del frontend:

```gitignore
# Frontend
frontend/.next/
frontend/node_modules/
frontend/.env.local
frontend/.env.development.local
frontend/.env.production.local
```

---

## Fase 5 — Docker Compose

Aggiungi il servizio `frontend` al `docker-compose.yml` esistente:

```yaml
frontend:
  build:
    context: ./frontend
    dockerfile: Dockerfile
  restart: unless-stopped
  env_file:
    - .env
  environment:
    - NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
    - SPRING_API_BASE_URL=http://springboot:443
    - DATABASE_URL=${FRONTEND_DATABASE_URL}
    - DB_SCHEMA=${DB_SCHEMA}
    - LOG_LEVEL=info
    - LOG_PRETTY=false
    - AUTH_BYPASS=false
  ports:
    - "3000:3000"
  depends_on:
    - springboot
  networks:
    - fatellisync-net
```

> **Nota su `SPRING_API_BASE_URL` in Docker:** dentro la rete Docker il frontend raggiunge Spring via hostname `springboot` (nome del servizio), non via URL pubblico. Usa `http://springboot:443` come valore interno. Il valore in `.env.local` rimane l'URL pubblico per lo sviluppo locale.

Aggiungi al file `.env.example` root le nuove variabili richieste dal frontend:

```env
# Frontend
NEXT_PUBLIC_APP_URL=https://hub.fatellicaterinasrl.com
FRONTEND_DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<dbname>?schema=<schema>
```

---

## Fase 6 — Dockerfile del frontend

Crea `frontend/Dockerfile` per build di produzione:

```dockerfile
FROM node:22-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
```

Aggiungi in `frontend/next.config.ts` il flag `output: "standalone"` necessario per il Dockerfile:

```ts
const nextConfig: NextConfig = {
  output: "standalone",        // ← aggiunto
  reactCompiler: true,
  allowedDevOrigins: parseAllowedDevOrigins(),
  typescript: {
    ignoreBuildErrors: true,
  },
};
```

---

## Fase 7 — Nginx (se presente)

Se il `docker-compose.yml` include Nginx come reverse proxy, aggiungi un location block per il frontend:

```nginx
location / {
    proxy_pass http://frontend:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Assicurati che le route `/api/` e `/images/` esistenti (verso Spring) abbiano priorità rispetto al catch-all del frontend.

---

## Fase 8 — Prisma: schema path

Il frontend usa Prisma per accesso diretto al DB. Verifica che `frontend/prisma/schema.prisma` abbia il provider corretto:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Nessuna modifica strutturale allo schema — il DB è condiviso con il backend. Liquibase (backend) è l'unico sistema autorizzato a fare migrazioni DDL. Prisma deve restare in modalità **read-only rispetto allo schema** (nessun `prisma migrate`, solo `prisma generate` e `prisma db pull` per sincronizzare il client).

---

## Fase 9 — Verifica CORS (Spring Boot)

Il backend Spring non ha una configurazione CORS esplicita nei file visibili. In sviluppo locale il frontend è su `localhost:3000` e il backend su `localhost:8080` (o 5050 via Docker) — CORS potrebbe bloccare le chiamate dirette.

Verifica se esiste una classe `@Configuration` con `CorsRegistry` o un filtro CORS nel backend. Se non esiste e le chiamate BFF verso Spring falliscono, aggiungere nel backend:

```java
@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
            .allowedOrigins("http://localhost:3000")
            .allowedMethods("GET", "POST", "PUT", "DELETE")
            .allowCredentials(true);
    }
}
```

> In produzione non serve (frontend e backend sono sullo stesso dominio via Nginx).

---

## Checklist finale

- [ ] Frontend copiato in `frontend/` senza `node_modules` e `.next`
- [ ] `package.json` rinominato a `@fatellisync/frontend`
- [ ] URL hardcoded nell'image route sostituito con `SPRING_API_BASE_URL`
- [ ] `frontend/.env.example` creato
- [ ] `frontend/.env.local` popolato con i valori reali
- [ ] `.gitignore` root aggiornato
- [ ] `docker-compose.yml` aggiornato con servizio `frontend`
- [ ] `.env.example` root aggiornato con variabili frontend
- [ ] `frontend/Dockerfile` creato
- [ ] `frontend/next.config.ts` aggiornato con `output: "standalone"`
- [ ] Nginx aggiornato (se applicabile)
- [ ] CORS verificato/aggiunto nel backend Spring (se necessario)
- [ ] `npm install` eseguito in `frontend/` per rigenerare `node_modules`
- [ ] `npm run dev` eseguito in `frontend/` e verificato che l'app parta
