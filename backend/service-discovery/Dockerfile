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
COPY core/build.gradle ./core/
COPY directs-service/build.gradle ./directs-service/
COPY service-discovery/build.gradle ./service-discovery/
COPY config-server/build.gradle ./config-server/
COPY api-gateway/build.gradle ./api-gateway/

RUN chmod +x gradlew && ./gradlew :service-discovery:dependencies --no-daemon

COPY service-discovery/src ./service-discovery/src

RUN ./gradlew :service-discovery:bootJar --no-daemon -x test


# ─────────────────────────────────────────
# STAGE 2: RUNTIME
# ─────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN adduser -D appuser && chown appuser /app

USER appuser

COPY --from=builder /app/service-discovery/build/libs/*.jar app.jar

EXPOSE 8761

ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=80.0", \
  "-jar", "app.jar"]
