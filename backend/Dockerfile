# syntax=docker/dockerfile:1

# ─────────────────────────────────────────
# STAGE 1: BUILD
# ─────────────────────────────────────────
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app

# Copia wrapper e config (cache layer importante)
COPY gradlew ./
COPY gradle ./gradle
COPY build.gradle settings.gradle ./

# Rendi eseguibile + scarica dipendenze (RUN uniti)
RUN chmod +x gradlew && ./gradlew dependencies --no-daemon

# Copia codice sorgente
COPY src ./src

# Build JAR
RUN ./gradlew bootJar --no-daemon -x test


# ─────────────────────────────────────────
# STAGE 2: RUNTIME
# ─────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Utente non-root (sicurezza)
RUN adduser -D appuser && chown appuser /app

USER appuser

# Copia solo artefatto finale
COPY --from=builder /app/build/libs/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=80.0", \
  "-jar", "app.jar"]