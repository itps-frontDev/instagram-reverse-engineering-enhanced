# 07 — Guida all'Installazione

[← Torna all'indice](../README.md)

**Prerequisiti:** Docker Desktop, Java 21.0.11, Node.js 22.21.1, pnpm 11.5.2.

```bash
# Verifica versioni
docker --version
java --version     # 21.0.11
node --version     # v22.21.1
pnpm --version     # 11.5.2
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

# Azure Blob Storage
# Sviluppo locale con Azurite (emulatore):
AZURE_STORAGE_CONNECTION_STRING=UseDevelopmentStorage=true
# Produzione — sostituire con la connection string reale da Azure Portal:
# AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...;AccountKey=...
AZURE_STORAGE_CONTAINER_NAME=iree-media

# Registry e tag delle immagini — SOLO per la modalità produzione
# (vedi sezione dedicata). In sviluppo si possono omettere.
# REGISTRY=local
# TAG=1.0.0
```

> In sviluppo lo storage Azure è emulato da **Azurite** (definito in `docker-compose.override.yml`). La connection string `UseDevelopmentStorage=true` viene sovrascritta dall'override con i parametri completi di Azurite — il valore nel `.env` serve come fallback.

Il progetto include un file `.env.example` nella root con tutte le variabili documentate e i comandi per generare i valori sensibili (es. `openssl rand -base64 32` per il JWT secret). Può essere usato come riferimento o come punto di partenza: `cp .env.example .env`.

---

## Step 2 — Avvio con Docker Compose (modalità sviluppo)

```bash
docker-compose up -d
```

> Senza `-f` espliciti, Docker Compose carica automaticamente anche
> `docker-compose.override.yml`: questo è l'avvio in **modalità sviluppo**
> (build locale, hot reload, Azurite). Per la modalità produzione vedi
> [la sezione dedicata](#esecuzione-in-modalità-produzione) più sotto.

Docker Compose avvia i servizi nel seguente ordine (con health check tra le dipendenze):

| Ordine | Servizio | Porta | Note |
| :--- | :--- | :--- | :--- |
| 1 | PostgreSQL 16 | 5432 | Esposta in sviluppo (IntelliJ, DBeaver, TablePlus) |
| 2 | Redis 7 | 6379 | Esposta in sviluppo (Redis Insight) |
| 3 | Azurite (storage emulato) | 10000 | Solo sviluppo |
| 4 | Service Discovery (Eureka) | 8761 | Dashboard raggiungibile dal browser |
| 5 | Config Server | 8888 | Solo interno |
| 6 | Core | 8081 | Solo via gateway |
| 7 | Directs Service | 8082 | Solo via gateway |
| 8 | API Gateway | **8080** | Unico entry point API |
| 9 | Frontend | **3000** | Entry point UI |

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

## Esecuzione in modalità produzione

La modalità sviluppo (sopra) builda tutto dal sorgente e funziona out-of-the-box.
La modalità **produzione** è quella con cui gira la demo ufficiale e si appoggia
a risorse Azure private (registry e storage), le cui credenziali **non sono
distribuite con il repository**. Le strade sono due:

### Opzione A — Demo online (zero configurazione)

Lo stack di produzione gira su una VM Azure:

**`http://instagram-demo.spaincentral.cloudapp.azure.com:3000`**

(login con l'account demo `lukewhite` / `password123`).

> ⚠️ La VM non è sempre accesa: per non consumare il credito Azure viene
> avviata solo quando serve. Se il link non risponde, la demo è semplicemente
> spenta in quel momento — non è un malfunzionamento. In tal caso usare
> l'Opzione B oppure la modalità sviluppo.

### Opzione B — Riprodurre la produzione in proprio

Senza accesso alle risorse private va ricreato l'equivalente in autonomia:

**1. Uno storage per i media.** Serve un account Azure Storage proprio
(qualunque tier, basta un container Blob): nel `.env` vanno impostate la
`AZURE_STORAGE_CONNECTION_STRING` reale e il `AZURE_STORAGE_CONTAINER_NAME`.
In produzione **Azurite non c'è**: il valore di sviluppo
`UseDevelopmentStorage=true` non funziona, perché l'emulatore esiste solo
nell'override dev.

**2. Le immagini, buildate dal sorgente.** Il registry della demo è privato,
quindi le immagini vanno costruite in locale. Nel `.env` aggiungere un prefisso
proprio (es. `REGISTRY=local` e `TAG=1.0.0`), poi:

```bash
# 5 moduli backend — Dockerfile unico parametrizzato
for entry in core:8081 directs-service:8082 api-gateway:8080 config-server:8888 service-discovery:8761; do
  m=${entry%%:*}; p=${entry##*:}
  docker build -f backend/Dockerfile --build-arg MODULE=$m --build-arg PORT=$p -t local/$m:1.0.0 backend/
done

# Frontend — gli URL pubblici vengono INLINATI NEL BUNDLE a build time:
# vanno passati qui, con il dominio (o localhost) su cui girerà lo stack
docker build \
  --build-arg NEXT_PUBLIC_API_URL=http://localhost:8080 \
  --build-arg NEXT_PUBLIC_WS_URL=http://localhost:8080/ws \
  --build-arg NEXT_PUBLIC_BASE_URL=http://localhost:3000 \
  -t local/frontend:1.0.0 frontend/
```

**3. Cookie su HTTP.** Se lo stack è servito in **HTTP puro** su un dominio
reale (non `localhost`, non HTTPS) — com'è il caso della VM demo — impostare
nel `.env`:

```env
COOKIE_SECURE=false
```

Senza questo, i cookie di auth vengono emessi con flag `Secure` e il browser
li scarta su HTTP: il login riesce ma si resta bloccati sulla pagina di login.
Con un deploy HTTPS lasciare la variabile vuota.

**4. Avvio.** Con `-f` esplicito, che esclude l'override di sviluppo:

```bash
# Primo avvio su database vuoto — esegue anche il seed (PostgreSQL + blob):
docker compose -f docker-compose.yml -f docker-compose.seed.yml up -d

# Avvii successivi — configurazione normale, nessun reseed:
docker compose -f docker-compose.yml up -d
```

Il file `docker-compose.seed.yml` attiva il profilo `dev` su `core` **e**
`directs-service` per un solo avvio: Liquibase esegue i changeset di seed
(utenti, post, chat) e il `DevBlobSeeder` carica i media sullo storage Azure
configurato (operazione idempotente: i blob già presenti vengono saltati).

### Differenze tra le due modalità

| | Sviluppo | Produzione |
| :--- | :--- | :--- |
| **Immagini** | buildate dal sorgente (`Dockerfile.dev`) | precompilate (registry o build locale) |
| **Codice** | bind mount + hot reload | impacchettato nell'immagine |
| **Storage media** | Azurite (emulatore locale) | Azure Blob Storage reale |
| **Seed dati** | automatico a ogni primo avvio | una tantum, col file seed |
| **Porte DB/Redis** | esposte (5432/6379) | non esposte |
| **Profilo Spring** | `dev` | `prod` |

---

[← Funzionalità](06-funzionalita.md) | [Troubleshooting →](08-troubleshooting.md)
