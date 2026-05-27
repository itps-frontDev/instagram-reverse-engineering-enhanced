# syntax=docker/dockerfile:1

# ─────────────────────────────────────────
# STAGE 1: BUILD
# context: ./backend (root multi-module)
# ─────────────────────────────────────────
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app

# Copia wrapper e config Gradle (questi cambiano raramente → layer cacheable)
COPY gradlew ./
COPY gradle ./gradle
COPY build.gradle settings.gradle ./

# build.gradle di tutti i sottomoduli — Gradle li richiede tutti perché
# settings.gradle li dichiara tutti. Ogni COPY crea la sottodirectory (Docker
# crea i parent quando la destinazione termina con /), altrimenti Gradle
# fallirebbe con "projectDirectory does not exist" per i moduli non copiati.
COPY core/build.gradle ./core/
COPY directs-service/build.gradle ./directs-service/
COPY service-discovery/build.gradle ./service-discovery/
COPY config-server/build.gradle ./config-server/
COPY api-gateway/build.gradle ./api-gateway/

# Rende eseguibile il wrapper e scarica le dipendenze di directs-service.
# Unire chmod e ./gradlew in un unico RUN evita un layer Docker intermedio inutile.
RUN chmod +x gradlew && ./gradlew :directs-service:dependencies --no-daemon

# Copia solo il sorgente di directs-service (non core, non gli altri moduli)
COPY directs-service/src ./directs-service/src

# Compila e produce il JAR eseguibile del sottomodulo directs-service
RUN ./gradlew :directs-service:bootJar --no-daemon -x test


# ─────────────────────────────────────────
# STAGE 2: RUNTIME
# ─────────────────────────────────────────
# Usa solo il JRE (non il JDK) per tenere l'immagine finale più leggera.
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Crea un utente non-root: per principio di least privilege il processo
# Java non deve girare come root all'interno del container.
RUN adduser -D appuser && chown appuser /app

USER appuser

# Copia il JAR dallo stage di build — il path riflette il nome del sottomodulo Gradle
COPY --from=builder /app/directs-service/build/libs/*.jar app.jar

EXPOSE 8082

ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=80.0", \
  "-jar", "app.jar"]
