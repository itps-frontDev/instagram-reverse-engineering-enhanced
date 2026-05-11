# Docker Spec — Backend (Spring Boot)

**Tipo documento:** Implementation
**Dipende da:** [Strategic Blueprint](strategic-blueprint.md)

---

## Analisi progetto sorgente

| Parametro | Valore |
|---|---|
| Java | 21 (toolchain Gradle) |
| Build tool | Gradle 9.5.0 (`gradlew`) |
| Spring Boot | 4.0.6 |
| Porta | 5051 (override via `SERVER_PORT=5051` in docker-compose) |
| JAR prodotto | `fatellisync-0.0.1-SNAPSHOT.jar` |
| SSL | Certificato manuale da SiteGround, chiavi in certbot/conf/live/hub.fatellicaterinasrl.com/ |

---

## Struttura da creare nella root del progetto

```
fatellisync/
├── docker-compose.yml
├── nginx.conf
├── .dockerignore
├── README.md
├── certbot/
│   ├── conf/    (vuota, popolata da Certbot al primo run)
│   └── www/     (vuota, popolata da Certbot al primo run)
├── backend/
│   ├── Dockerfile
│   ├── build.gradle
│   ├── settings.gradle
│   ├── gradlew
│   ├── gradlew.bat
│   ├── gradle/
│   └── src/
└── frontend/
    └── (da aggiungere)
```

---

## Nuovo file: `src/main/resources/application-docker.yaml`

Il profilo Spring Boot attivo nel container deve essere quello di default (nessun override tramite SPRING_PROFILES_ACTIVE). L'applicazione deve funzionare senza profili custom per Docker.

```yaml
spring:
  data:
    redis:
      host: redis
      port: 6379

fatellisync:
  taxi:
    skip-export: true    # EXPOFATELLI gira su Windows via Task Scheduler; il container legge i DBF già pronti
    path:
      anagrafica: "/mnt/taxi/res/artmag.dbf"
      brand: "/mnt/taxi/gimarc1/fornit.dbf"
      ean: "/mnt/taxi/gimarc1/fornpro.dbf"

  images:
    base-path: "/mnt/images"
    cache-dir: "/mnt/images/.cache"
    cdn-base-url: "https://hub.fatellicaterinasrl.com"
```

### Nota su `skip-export`

`TaxiIndexingStrategy` chiama `cmd.exe /c EXPOFATELLI` prima di leggere il DBF. Quel comando non può girare in un container Linux. Con `skip-export: true` Spring Boot salta il comando e legge direttamente i file montati. L'export è delegato a un Task Scheduler Windows sull'host (vedi README).

---

## `backend/Dockerfile`

```dockerfile
FROM eclipse-temurin:21-jdk AS builder
WORKDIR /app
COPY . .
RUN chmod +x gradlew && ./gradlew bootJar -x test --no-daemon

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=builder /app/build/libs/fatellisync-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

Il build context nel compose è `./backend`.

---

## `docker-compose.yml`

```yaml
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./certbot/conf:/etc/letsencrypt:ro
      - ./certbot/www:/var/www/certbot:ro
    depends_on:
      - springboot
    restart: always

  certbot:
    image: certbot/certbot
    volumes:
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done;'"
    restart: always

  redis:
    image: redis:7-alpine
    expose:
      - "6379"
    restart: always

  springboot:
    build:
      context: ./backend
      dockerfile: Dockerfile
    expose:
      - "5051"
    environment:
      - SERVER_PORT=5051
      - DB_URL=${DB_URL}
      - DB_USERNAME=${DB_USERNAME}
      - DB_PASSWORD=${DB_PASSWORD}
      - DB_SCHEMA=${DB_SCHEMA}
      - SPRING_DATA_REDIS_HOST=redis
      - SPRING_DATA_REDIS_PORT=6379
    volumes:
      - "T:/usr/taxi:/mnt/taxi"                        # DBF generati da EXPOFATELLI via Task Scheduler
      - "T:/usr/taxi/gimarc1/pic articles:/mnt/images" # immagini prodotti
    depends_on:
      - redis
    restart: always

networks:
  default:
    name: fatellisync_network
```

> **Nota volumi Windows:** L'unità `T:` deve essere mappata e disponibile prima di avviare Docker.

---

## `nginx.conf`

```nginx
events {
    worker_connections 1024;
}

http {
    server {
        listen 80;
        server_name hub.fatellicaterinasrl.com;

        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        location / {
            return 301 https://$host$request_uri;
        }
    }

    server {
        listen 443 ssl;
        server_name hub.fatellicaterinasrl.com;

        ssl_certificate     /etc/letsencrypt/live/hub.fatellicaterinasrl.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/hub.fatellicaterinasrl.com/privkey.pem;
        include             /etc/letsencrypt/options-ssl-nginx.conf;
        ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;

        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers   HIGH:!aNULL:!MD5;

        location / {
            proxy_pass         http://springboot:5051;
            proxy_set_header   Host              $host;
            proxy_set_header   X-Real-IP         $remote_addr;
            proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
            proxy_set_header   X-Forwarded-Proto $scheme;
        }
    }
}
```

`options-ssl-nginx.conf` e `ssl-dhparams.pem` vengono creati automaticamente da Certbot al primo run.

---

## `.dockerignore`

```
.git
.gradle
build/
.idea/
logs/
*.log
certbot/
```

---

## Anti-patterns (DO NOT)

| ❌ Non fare | ✅ Fare invece | Perché |
|---|---|---|
| Mettere credenziali DB/JWT nel Dockerfile | Usare le env var già in `application.yaml` | Il Dockerfile non deve contenere segreti |
| Usare `latest` per le immagini | Tag espliciti: `redis:7-alpine`, `nginx:alpine`, `eclipse-temurin:21-jre` | `latest` introduce regressioni non tracciate |
| Attivare il profilo `dev` in Docker | Non impostare `SPRING_PROFILES_ACTIVE` — usare il profilo default | Il profilo `dev` usa path Windows diretti che non esistono nel container |
| Avviare lo stack senza prima avere il certificato SSL | Avviare nginx → certbot → stack completo | Nginx non parte se i file `.pem` mancano |
| Fare girare EXPOFATELLI dentro Docker | Task Scheduler Windows sull'host | Semplicità e affidabilità; nessuna dipendenza da Wine |

---

## Error Handling Matrix

| Scenario | Rilevamento | Comportamento atteso | Note |
|---|---|---|---|
| Unità `T:` non disponibile all'avvio | Docker Compose fallisce il mount | Container `springboot` non parte | Verificare che `T:` sia mappata prima di `docker compose up` |
| Redis non raggiungibile | Spring Boot lancia eccezione all'avvio | Applicazione non parte | `depends_on: redis` garantisce l'ordine di avvio |
| File DBF non trovato al path montato | `TaxiIndexingStrategy` lancia `RuntimeException` | Indicizzazione TAXI fallisce, le altre sorgenti continuano | Verificare che Task Scheduler abbia eseguito almeno un export |
| Certificato SSL non ancora generato | Nginx non trova i file `.pem` | Nginx non parte | Seguire la procedura di prima installazione nel README |
| Task Scheduler fermo — DBF obsoleto | File DBF con timestamp vecchio | Indicizzazione legge dati obsoleti ma non crasha | Monitorare il timestamp di `artmag.dbf` con TC-D04 |

---

## README.md

````markdown
# FatelliSync — Docker Setup

## Prerequisiti

- Docker Desktop for Windows con "Start Docker Desktop on login" abilitato
- Unità `T:` mappata e accessibile sul sistema host
- DNS di `hub.fatellicaterinasrl.com` puntato all'IP del server
- Task Scheduler Windows configurato per EXPOFATELLI (vedi sotto)

## Task Scheduler Windows — export DBF TAXI

Creare un task schedulato (ogni ora, es. a `:50`) con il comando:

```
cmd.exe /c "cd /d T:/usr/taxi && EXPOFATELLI 1"
```

Il task aggiorna i file DBF che Docker legge via volume montato. Spring Boot
indicizza automaticamente a `:00` (10 minuti dopo l'export).

## Prima installazione — certificato Let's Encrypt

```bash
docker compose up -d nginx
docker compose run --rm certbot certonly \
  --webroot --webroot-path=/var/www/certbot \
  -d hub.fatellicaterinasrl.com
```

## Avvio completo

```bash
docker compose up --build -d
```

## Rinnovo automatico SSL

Il container `certbot` rinnova automaticamente ogni 12 ore.

## Avvio automatico con Docker Desktop

Tutti i servizi hanno `restart: always`.
````

---

## Riferimenti

| Contenuto | Documento |
|---|---|
| Blueprint strategico | [strategic-blueprint.md](strategic-blueprint.md) |
| Spec indicizzatore TAXI | [core/products/indexer.md](core/products/indexer.md) |
