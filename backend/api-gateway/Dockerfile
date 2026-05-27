# syntax=docker/dockerfile:1

# ─────────────────────────────────────────
# STAGE 1: BUILD
# context: ./backend (root multi-module)
# ─────────────────────────────────────────
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app

COPY gradlew ./
COPY gradle ./gradle
COPY build.gradle settings.gradle ./

# build.gradle di tutti i sottomoduli — Gradle li richiede tutti per la resolution.
# COPY con destinazione che termina in / crea la sottodirectory automaticamente.
COPY core/build.gradle ./core/
COPY directs-service/build.gradle ./directs-service/
COPY service-discovery/build.gradle ./service-discovery/
COPY config-server/build.gradle ./config-server/
COPY api-gateway/build.gradle ./api-gateway/

RUN chmod +x gradlew && ./gradlew :api-gateway:dependencies --no-daemon

COPY api-gateway/src ./api-gateway/src

RUN ./gradlew :api-gateway:bootJar --no-daemon -x test


# ─────────────────────────────────────────
# STAGE 2: RUNTIME
# ─────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN adduser -D appuser && chown appuser /app

USER appuser

COPY --from=builder /app/api-gateway/build/libs/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=80.0", \
  "-jar", "app.jar"]
