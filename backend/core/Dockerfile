# syntax=docker/dockerfile:1

# ─────────────────────────────────────────
# STAGE 1: BUILD
# context: ./backend (root multi-module)
# ─────────────────────────────────────────
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app

# Copia wrapper e config (cache layer importante)
COPY gradlew ./
COPY gradle ./gradle
COPY build.gradle settings.gradle ./

# build.gradle di tutti i sottomoduli — Gradle li richiede tutti perché
# settings.gradle li dichiara tutti. Ogni COPY crea la sottodirectory corrispondente
# (Docker crea i parent quando la destinazione termina con /), altrimenti Gradle
# fallirebbe con "projectDirectory does not exist" per i moduli non copiati.
COPY core/build.gradle ./core/
COPY directs-service/build.gradle ./directs-service/
COPY service-discovery/build.gradle ./service-discovery/
COPY config-server/build.gradle ./config-server/
COPY api-gateway/build.gradle ./api-gateway/

# Rendi eseguibile + scarica dipendenze (RUN uniti)
RUN chmod +x gradlew && ./gradlew :core:dependencies --no-daemon

# Copia solo il sorgente di core
COPY core/src ./core/src

# Build JAR del sottomodulo core
RUN ./gradlew :core:bootJar --no-daemon -x test


# ─────────────────────────────────────────
# STAGE 2: RUNTIME
# ─────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Utente non-root (sicurezza)
RUN adduser -D appuser && chown appuser /app

USER appuser

# Il jar finisce in core/build/libs/ perché :core è il nome del sottomodulo
COPY --from=builder /app/core/build/libs/*.jar app.jar

EXPOSE 8081

ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=80.0", \
  "-jar", "app.jar"]
