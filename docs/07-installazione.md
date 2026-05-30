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
DB_NAME=instagram
DB_USER=postgres
DB_PASSWORD=postgres

# JWT
AUTH_JWT_SECRET=dev-secret-change-in-production-must-be-long-enough

# Frontend
API_URL=http://localhost:8080
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Cookie
AUTH_ACCESS_TOKEN_COOKIE_NAME=access_token
AUTH_ACCESS_TOKEN_COOKIE_PATH=/
AUTH_REFRESH_TOKEN_COOKIE_NAME=refresh_token
AUTH_REFRESH_TOKEN_COOKIE_PATH=/

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000

# Azure Blob Storage (produzione — in sviluppo viene sovrascritto dall'override)
AZURE_STORAGE_CONNECTION_STRING=
AZURE_STORAGE_CONTAINER_NAME=
```

> In sviluppo lo storage Azure è emulato da **Azurite** (definito in `docker-compose.override.yml`). Le variabili `AZURE_*` vengono sovrascritte automaticamente dall'override e possono essere lasciate vuote.

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

> Al primo avvio attendere circa 60-90 secondi per l'inizializzazione completa di tutti i servizi.

---

## Step 3 — Aprire l'app

Una volta avviati tutti i container, aprire `http://localhost:3000` nel browser.

### Registrare un nuovo account

1. Cliccare **"Sign up"** nella schermata di login.
2. Inserire email, username e password.
3. Completare il profilo (nome, bio opzionale).
4. Accedere con le credenziali appena create.

### Usare un account demo (dati di seed)

Il seed di sviluppo crea **80 utenti demo** con dati generati automaticamente. Tutti gli account demo hanno la stessa password:

| Campo | Valore |
| :--- | :--- |
| **Username** | `lukewhite` |
| **Password** | `password123` |

Tutti gli altri 79 account demo usano la stessa password `password123`. Per esplorare gli altri username disponibili, connettersi al database (porta 5432 esposta in sviluppo) con **IntelliJ IDEA** (Database tool integrato), DBeaver o TablePlus ed eseguire:

```sql
SELECT username FROM profiles LIMIT 10;
```

Oppure registrare semplicemente un nuovo account: la registrazione è aperta.

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
