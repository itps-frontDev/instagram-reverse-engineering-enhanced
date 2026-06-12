# syntax=docker/dockerfile:1

# Dockerfile unico per tutti i moduli backend (sostituisce i 5 Dockerfile
# per-modulo, che erano identici a parte nome e porta).
# Il modulo da compilare si sceglie con i build args:
#
#   docker build -f Dockerfile --build-arg MODULE=core --build-arg PORT=8081 .
#
# Nel compose: build.args → MODULE / PORT (vedi docker-compose.override.yml).

# ─────────────────────────────────────────
# STAGE 1: BUILD
# context: ./backend (root multi-module)
# ─────────────────────────────────────────
FROM eclipse-temurin:21-jdk-alpine AS builder
ARG MODULE
WORKDIR /app

# Copia wrapper e config (cache layer importante)
COPY gradlew ./
COPY gradle ./gradle
COPY build.gradle settings.gradle ./

# build.gradle di tutti i sottomoduli — Gradle li richiede tutti perché
# settings.gradle li dichiara tutti. Ogni COPY crea la sottodirectory
# corrispondente (Docker crea i parent quando la destinazione termina con /),
# altrimenti Gradle fallirebbe con "projectDirectory does not exist".
COPY core/build.gradle ./core/
COPY directs-service/build.gradle ./directs-service/
COPY service-discovery/build.gradle ./service-discovery/
COPY config-server/build.gradle ./config-server/
COPY api-gateway/build.gradle ./api-gateway/

# Copia solo il sorgente del modulo da compilare
COPY ${MODULE}/src ./${MODULE}/src

# Compila il JAR. La cache mount di BuildKit conserva /root/.gradle tra una
# build e l'altra: le dipendenze si scaricano solo la prima volta — non serve
# più il pre-download con ":modulo:dependencies" (che peraltro non risolveva
# tutte le configuration). sharing=locked serializza l'accesso alla cache
# quando compose costruisce più immagini backend in parallelo.
RUN --mount=type=cache,target=/root/.gradle,sharing=locked \
    chmod +x gradlew && ./gradlew :${MODULE}:bootJar --no-daemon -x test

# Estrae il fat jar nei layer Spring Boot (dependencies, loader, application):
# nel runtime stage diventano layer Docker separati, così una modifica al
# codice invalida solo i KB delle classi applicative, non i MB di dipendenze.
RUN java -Djarmode=layertools -jar ${MODULE}/build/libs/*.jar extract --destination /layers


# ─────────────────────────────────────────
# STAGE 2: RUNTIME
# ─────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine
ARG PORT
WORKDIR /app

# Utente non-root (sicurezza)
RUN adduser -D appuser && chown appuser /app

USER appuser

# Un COPY per layer Spring Boot, dal meno volatile al più volatile:
# le dipendenze cambiano di rado e restano in cache tra le build.
COPY --from=builder /layers/dependencies/ ./
COPY --from=builder /layers/spring-boot-loader/ ./
COPY --from=builder /layers/snapshot-dependencies/ ./
COPY --from=builder /layers/application/ ./

EXPOSE ${PORT}

# -XX:+UseContainerSupport non serve: è attivo di default da JDK 10.
# JarLauncher avvia l'app esattamente come "java -jar" sul fat jar.
ENTRYPOINT ["java", \
  "-XX:MaxRAMPercentage=80.0", \
  "org.springframework.boot.loader.launch.JarLauncher"]
