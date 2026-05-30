# 07 — Guida all'Installazione

[← Torna all'indice](../README.md)

**Prerequisiti:** Docker Desktop, Java 21.0.11, Node.js 22.21.1, pnpm 11.0.9.

```bash
# Verifica versioni
docker --version
java --version     # 21.0.11
node --version     # v22.21.1
pnpm --version     # 11.0.9
```

> **Node.js v22** — il frontend è testato con Node.js 22.21.1. La v24 può causare incompatibilità con alcune dipendenze native.

---

## Step 1 — Variabili d'ambiente

Il `docker-compose.yml` legge le variabili da un file `.env` nella root del progetto. Creare il file copiando i valori seguenti (adatti allo sviluppo locale):

```env
# Database
DB_NAME=iree_db
DB_USER=iree_user
DB_PASSWORD=<scegli una password>

# JWT — genera con: openssl rand -base64 32
AUTH_JWT_SECRET=<output del comando openssl>

# Frontend
API_URL=http://localhost:8080
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Cookie
AUTH_ACCESS_TOKEN_COOKIE_NAME=iree_access_token
AUTH_ACCESS_TOKEN_COOKIE_PATH=/
AUTH_REFRESH_TOKEN_COOKIE_NAME=iree_refresh_token
AUTH_REFRESH_TOKEN_COOKIE_PATH=/

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000

# Bypass autenticazione — solo sviluppo locale, mai true in produzione
AUTH_BYPASS=false

# Azure Blob Storage
# Sviluppo locale con Azurite (emulatore):
AZURE_STORAGE_CONNECTION_STRING=UseDevelopmentStorage=true
# Produzione — sostituire con la connection string reale da Azure Portal:
# AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...;AccountKey=...
AZURE_STORAGE_CONTAINER_NAME=iree-media
```

> In sviluppo lo storage Azure è emulato da **Azurite** (definito in `docker-compose.override.yml`). La connection string `UseDevelopmentStorage=true` viene sovrascritta dall'override con i parametri completi di Azurite — il valore nel `.env` serve come fallback.

Il progetto include un file `.env.example` nella root con tutte le variabili documentate e i comandi per generare i valori sensibili (es. `openssl rand -base64 32` per il JWT secret). Può essere usato come riferimento o come punto di partenza: `cp .env.example .env`.

---

## Step 2 — Avvio con Docker Compose

```bash
docker-compose up -d
```

Docker Compose avvia i servizi nel seguente ordine (con health check tra le dipendenze):

| Ordine | Servizio | Porta |
| :--- | :--- | :--- |
| 1 | PostgreSQL 16 | 5432 (interna) |
| 2 | Redis 7 | 6379 (interna) |
| 3 | Azurite (storage emulato) | 10000 (interna) |
| 4 | Service Discovery (Eureka) | 8761 |
| 5 | Config Server | 8888 |
| 6 | Core | 8081 (interna) |
| 7 | Directs Service | 8082 (interna) |
| 8 | API Gateway | **8080** |
| 9 | Frontend | **3000** |

> **Primo avvio** (`--build`): attendere 5-10 minuti — Docker deve scaricare le immagini base, compilare i 5 moduli Gradle e applicare le migrazioni Liquibase con il seed di dati demo.
> **Avvii successivi** (senza `--build`): 2-3 minuti, il tempo necessario ai servizi Spring Boot di avviarsi, registrarsi su Eureka e superare gli health check.

---

## Step 3 — Aprire l'app

Una volta avviati tutti i container, aprire `http://localhost:3000` nel browser.

### Registrare un nuovo account

La registrazione è in due step:

**Step 1** — inserire email, password, nome completo e username, poi cliccare **"Avanti"**.

**Step 2** — selezionare la data di nascita dai dropdown e cliccare **"Avanti"** per completare la registrazione.

L'app reindirizza automaticamente alla pagina di login.

### Accedere con un account demo

Il seed di sviluppo popola automaticamente il database con **80 utenti demo**. Per accedere subito senza registrarsi:

| Campo | Valore |
| :--- | :--- |
| **Username** | `lukewhite` |
| **Password** | `password123` |

Tutti gli 80 account demo condividono la stessa password `password123`. Per scoprire altri username disponibili, connettersi al database (porta 5432 esposta in sviluppo) con **IntelliJ IDEA** (Database tool integrato), DBeaver o TablePlus ed eseguire:

```sql
SELECT username FROM profiles LIMIT 10;
```

---

## Avvio manuale (sviluppo con hot-reload)

Per sviluppare con riavvio rapido dei singoli moduli, avviare solo l'infrastruttura in Docker e i servizi Spring Boot direttamente dalla JVM locale.

**Infrastruttura:**
```bash
docker-compose up -d db redis azurite
```

**Service Discovery e Config Server** (in terminali separati):
```bash
cd backend
./gradlew :service-discovery:bootRun
./gradlew :config-server:bootRun
```

**Servizi applicativi** (in terminali separati):
```bash
./gradlew :core:bootRun
./gradlew :directs-service:bootRun
./gradlew :api-gateway:bootRun
```

**Frontend:**
```bash
cd frontend
pnpm install
pnpm dev
```

Il frontend è accessibile su `http://localhost:3000`. Tutte le chiamate API transitano per il gateway su `http://localhost:8080`.

---

## Porte di riferimento

| Servizio | Porta | Note |
| :--- | :--- | :--- |
| Frontend | 3000 | Entry point UI |
| API Gateway | 8080 | Unico entry point API |
| Core | 8081 | Solo via gateway |
| Directs Service | 8082 | Solo via gateway |
| Eureka Dashboard | 8761 | Solo sviluppo |
| Config Server | 8888 | Solo interno |
| PostgreSQL | 5432 | Esposta in sviluppo (DBeaver, TablePlus) |
| Redis | 6379 | Esposta in sviluppo (Redis Insight) |
| Azurite (Blob) | 10000 | Solo sviluppo |

---

[← Funzionalità](06-funzionalita.md) | [Troubleshooting →](08-troubleshooting.md)
