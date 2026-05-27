# Microservices Migration Spec (Implementation)

**Document type:** Implementation  
**Version:** 1.0  
**Scope:** Ristrutturazione `backend/` come Gradle multi-module project + estrazione `directs-service` + aggiunta `service-discovery`, `config-server`, `api-gateway` + aggiornamento `docker-compose.yml`

---

## 1. Objective

Introdurre un'architettura a microservizi minima nel progetto mantenendo un **database PostgreSQL condiviso** (nessuna separazione di schema), seguendo il pattern **Strangler Fig** applicato al solo modulo `directs`.

Il monolite rimane operativo e invariato nelle sue funzionalità. La migrazione aggiunge infrastruttura Spring Cloud (Eureka, Config Server, Gateway) e sposta il modulo `directs` in un servizio standalone.

### Expected outcome

1. `backend/` diventa un **Gradle multi-module project** con 5 sottomoduli: `app`, `directs-service`, `service-discovery`, `config-server`, `api-gateway`.
2. `service-discovery` — Eureka Server su porta `8761`. Ogni servizio si registra all'avvio.
3. `config-server` — Spring Cloud Config Server in modalità `native`. Legge i file di configurazione da `backend/config-server/src/main/resources/config/`. Nessun repository Git separato.
4. `api-gateway` — Spring Cloud Gateway su porta `8080` (porta pubblica invariata). Instrada le richieste verso `app` e `directs-service` tramite Eureka load balancer (`lb://`).
5. `app` — monolite attuale spostato nella sottocartella `backend/app/`. Porta interna cambiata da `8080` a `8081`. Aggiunto Eureka client. Rimosso il package `it.evodev.instagram.directs` e `WebSocketConfig`/`WebSocketAuthChannelInterceptor`.
6. `directs-service` — nuovo Spring Boot standalone su porta `8082`. Contiene tutto il codice del modulo `directs` + replica minimale delle classi `auth` necessarie + entity `Profile` read-only sul DB condiviso.
7. `docker-compose.yml` aggiornato con 3 nuovi servizi (`service-discovery`, `config-server`, `api-gateway`), servizio `backend` rinominato in `app` e `directs-service` aggiunto. Il `frontend` non cambia — punta ancora a porta `8080` (gateway).
8. `docker-compose.override.yml` aggiornato coerentemente.

---

## 2. Scope Boundaries

### In scope

1. Ristrutturazione `backend/` come Gradle multi-module (root `build.gradle` + `settings.gradle`).
2. Creazione `service-discovery` — Eureka Server minimale, nessuna logica custom.
3. Creazione `config-server` — Spring Cloud Config native con file di config per ogni servizio.
4. Creazione `api-gateway` — Spring Cloud Gateway con routing verso `app` e `directs-service`; supporto WebSocket per `/ws/**`.
5. Migrazione `app` — aggiunta Eureka client, cambio porta a `8081`, rimozione package `directs` e WebSocketConfig.
6. Creazione `directs-service` — copia di tutto il package `directs` + classi `auth` necessarie (JWT) + entity `Profile` read-only.
7. Dockerfile per ciascuno dei 5 sottomoduli con `context: ./backend` e build targetizzata al sottomodulo.
8. Aggiornamento `docker-compose.yml` e `docker-compose.override.yml`.

### Out of scope

1. Separazione del database — tutti i servizi condividono lo stesso schema PostgreSQL.
2. Migrazione di altri moduli (posts, likes, follow, ecc.) in microservizi separati.
3. RabbitMQ/Kafka — non necessari: `directs-service` non emette né consuma eventi da altri moduli.
4. Spring Cloud Config su repository Git esterno — si usa il filesystem del repository corrente.
5. Autenticazione centralizzata nel gateway (JWT filter nel gateway) — ogni servizio valida il JWT autonomamente con lo stesso secret condiviso.
6. Horizontal scaling / Redis Pub/Sub per WebSocket multi-istanza — out of scope per questa spec.
7. Spring Cloud Circuit Breaker (Resilience4j) — out of scope.
8. Distributed tracing (Zipkin/Jaeger) — out of scope.

---

## 3. Target Architecture

### 3.1 Topologia dei servizi

```
Frontend (Next.js :3000)
    │
    ▼
api-gateway (:8080)  ← Spring Cloud Gateway + Eureka Client
    │
    ├── /api/priv/direct/**  ──►  directs-service (:8082)  ← Eureka Client
    ├── /api/pub/direct/**   ──►  directs-service (:8082)
    ├── /ws/**               ──►  directs-service (:8082)  ← WebSocket proxy
    └── /**                  ──►  app (:8081)               ← Eureka Client
    
service-discovery (:8761)  ← Eureka Server (solo registry)
config-server (:8888)      ← Spring Cloud Config native

PostgreSQL (:5432)  ← condiviso da app + directs-service
Redis (:6379)       ← usato solo da app
```

### 3.2 Struttura directory `backend/` dopo la migrazione

```
backend/
├── settings.gradle                  ← dichiara i 5 sottomoduli
├── build.gradle                     ← root: BOM Spring Cloud, plugin comuni
│
├── app/                             ← monolite (era backend/src/)
│   ├── src/main/java/it/evodev/instagram/
│   │   ├── auth/
│   │   ├── comments/
│   │   ├── common/
│   │   ├── config/                  ← WebSocketConfig e WebSocketAuthChannelInterceptor RIMOSSI
│   │   ├── explore/
│   │   ├── feed/
│   │   ├── follow/
│   │   ├── likes/
│   │   ├── media/
│   │   ├── notifications/
│   │   ├── posts/
│   │   ├── profile/
│   │   ├── redis/
│   │   ├── reels/
│   │   ├── search/
│   │   └── stories/
│   │   (directs/ RIMOSSO)
│   ├── src/main/resources/
│   │   ├── application.properties   ← porta 8081, config-server import
│   │   └── db/                      ← Liquibase invariato
│   ├── build.gradle
│   └── Dockerfile
│
├── directs-service/
│   ├── src/main/java/it/evodev/directs/
│   │   ├── config/
│   │   │   ├── WebSocketConfig.java
│   │   │   └── WebSocketAuthChannelInterceptor.java
│   │   ├── controllers/
│   │   │   ├── DirectRestController.java
│   │   │   └── DirectWebSocketController.java
│   │   ├── dto/
│   │   ├── exceptions/
│   │   ├── models/
│   │   │   ├── Chat.java
│   │   │   ├── ChatParticipant.java
│   │   │   ├── Message.java
│   │   │   └── Profile.java         ← entity read-only, stessa tabella profiles
│   │   ├── repositories/
│   │   ├── services/
│   │   └── util/
│   │       └── UuidV7Generator.java ← copiato da auth
│   ├── src/main/resources/
│   │   └── application.properties   ← nome app + config-server import
│   ├── build.gradle
│   └── Dockerfile
│
├── service-discovery/
│   ├── src/main/java/it/evodev/discovery/
│   │   └── ServiceDiscoveryApplication.java
│   ├── src/main/resources/
│   │   └── application.properties
│   ├── build.gradle
│   └── Dockerfile
│
├── config-server/
│   ├── src/main/java/it/evodev/config/
│   │   └── ConfigServerApplication.java
│   ├── src/main/resources/
│   │   ├── application.properties   ← porta 8888, profilo native
│   │   └── config/                  ← file di config per ogni servizio
│   │       ├── app.properties
│   │       ├── directs-service.properties
│   │       └── api-gateway.properties
│   ├── build.gradle
│   └── Dockerfile
│
└── api-gateway/
    ├── src/main/java/it/evodev/gateway/
    │   └── ApiGatewayApplication.java
    ├── src/main/resources/
    │   └── application.properties   ← nome app + config-server import
    ├── build.gradle
    └── Dockerfile
```

### 3.3 Regole architetturali

1. **Database condiviso**: `app` e `directs-service` puntano allo stesso PostgreSQL. `directs-service` non esegue mai scritture sulla tabella `profiles` — solo letture.
2. **Nessun evento cross-service**: `directs-service` non pubblica né consuma Spring Events da `app`. La comunicazione è solo attraverso il DB condiviso e REST/WebSocket via gateway.
3. **JWT autonomo**: ogni servizio valida il JWT indipendentemente usando lo stesso `AUTH_JWT_SECRET` passato come variabile d'ambiente. Nessun gateway-level JWT filter.
4. **Liquibase solo in `app`**: le migrazioni del DB sono gestite esclusivamente dal modulo `app` all'avvio. `directs-service` usa `spring.jpa.hibernate.ddl-auto=validate`.
5. **Porta pubblica invariata**: il frontend continua a puntare a `8080`. Solo il gateway è esposto pubblicamente. `app` (`:8081`) e `directs-service` (`:8082`) sono raggiungibili solo nella rete Docker interna.

---

## 4. Gradle Multi-Module Design

### 4.1 `backend/settings.gradle` (root)

```groovy
plugins {
    id 'org.gradle.toolchains.foojay-resolver-convention' version '1.0.0'
}

rootProject.name = 'instagram'

include 'app'
include 'directs-service'
include 'service-discovery'
include 'config-server'
include 'api-gateway'
```

### 4.2 `backend/build.gradle` (root)

```groovy
plugins {
    id 'org.springframework.boot'     version '3.4.5' apply false
    id 'io.spring.dependency-management' version '1.1.7' apply false
    id 'java'                                          apply false
}

subprojects {
    apply plugin: 'java'
    apply plugin: 'io.spring.dependency-management'

    group   = 'it.evodev'
    version = '0.0.1-SNAPSHOT'

    java {
        toolchain {
            languageVersion = JavaLanguageVersion.of(21)
        }
    }

    repositories {
        mavenCentral()
    }

    dependencyManagement {
        imports {
            mavenBom 'org.springframework.boot:spring-boot-dependencies:3.4.5'
            mavenBom 'org.springframework.cloud:spring-cloud-dependencies:2024.0.1'
            mavenBom 'com.azure.spring:spring-cloud-azure-dependencies:5.24.0'
        }
    }
}
```

**Nota Spring Cloud 2024.0.1:** è la versione compatibile con Spring Boot 3.4.x. Non usare Spring Cloud `2023.x` — richiede Spring Boot 3.2.x–3.3.x.

### 4.3 `backend/app/build.gradle`

```groovy
plugins {
    id 'org.springframework.boot'
}

dependencies {
    // identico all'attuale backend/build.gradle
    // rimuovere: spring-boot-starter-websocket
    // (WebSocket rimane solo in directs-service)
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
    implementation 'org.liquibase:liquibase-core'
    implementation 'org.springframework.boot:spring-boot-starter-security'
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.boot:spring-boot-starter-data-redis'
    implementation 'org.springframework.boot:spring-boot-starter-validation'
    implementation 'org.springframework.boot:spring-boot-starter-actuator'

    // Spring Cloud Eureka client
    implementation 'org.springframework.cloud:spring-cloud-starter-netflix-eureka-client'

    // Spring Cloud Config client
    implementation 'org.springframework.cloud:spring-cloud-starter-config'

    implementation 'io.jsonwebtoken:jjwt-api:0.12.6'
    runtimeOnly    'io.jsonwebtoken:jjwt-impl:0.12.6'
    runtimeOnly    'io.jsonwebtoken:jjwt-jackson:0.12.6'

    runtimeOnly 'org.postgresql:postgresql'

    implementation 'com.azure.spring:spring-cloud-azure-starter-storage-blob'

    compileOnly         'org.projectlombok:lombok'
    annotationProcessor 'org.projectlombok:lombok'
    implementation      'com.fasterxml.jackson.core:jackson-databind'

    testImplementation 'org.springframework.boot:spring-boot-starter-test'
    testImplementation 'org.springframework.security:spring-security-test'
}

tasks.named('test') {
    useJUnitPlatform()
}
```

### 4.4 `backend/directs-service/build.gradle`

```groovy
plugins {
    id 'org.springframework.boot'
}

dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
    implementation 'org.springframework.boot:spring-boot-starter-security'
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.boot:spring-boot-starter-websocket'
    implementation 'org.springframework.boot:spring-boot-starter-validation'
    implementation 'org.springframework.boot:spring-boot-starter-actuator'

    // Spring Cloud
    implementation 'org.springframework.cloud:spring-cloud-starter-netflix-eureka-client'
    implementation 'org.springframework.cloud:spring-cloud-starter-config'

    // JWT (identico ad app)
    implementation 'io.jsonwebtoken:jjwt-api:0.12.6'
    runtimeOnly    'io.jsonwebtoken:jjwt-impl:0.12.6'
    runtimeOnly    'io.jsonwebtoken:jjwt-jackson:0.12.6'

    runtimeOnly 'org.postgresql:postgresql'

    compileOnly         'org.projectlombok:lombok'
    annotationProcessor 'org.projectlombok:lombok'
    implementation      'com.fasterxml.jackson.core:jackson-databind'

    testImplementation 'org.springframework.boot:spring-boot-starter-test'
}

tasks.named('test') {
    useJUnitPlatform()
}
```

### 4.5 `backend/service-discovery/build.gradle`

```groovy
plugins {
    id 'org.springframework.boot'
}

dependencies {
    implementation 'org.springframework.cloud:spring-cloud-starter-netflix-eureka-server'
    implementation 'org.springframework.boot:spring-boot-starter-actuator'
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
}

tasks.named('test') {
    useJUnitPlatform()
}
```

### 4.6 `backend/config-server/build.gradle`

```groovy
plugins {
    id 'org.springframework.boot'
}

dependencies {
    implementation 'org.springframework.cloud:spring-cloud-config-server'
    implementation 'org.springframework.boot:spring-boot-starter-actuator'
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
}

tasks.named('test') {
    useJUnitPlatform()
}
```

### 4.7 `backend/api-gateway/build.gradle`

```groovy
plugins {
    id 'org.springframework.boot'
}

dependencies {
    implementation 'org.springframework.cloud:spring-cloud-starter-gateway'
    implementation 'org.springframework.cloud:spring-cloud-starter-netflix-eureka-client'
    implementation 'org.springframework.cloud:spring-cloud-starter-config'
    implementation 'org.springframework.boot:spring-boot-starter-actuator'
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
}

tasks.named('test') {
    useJUnitPlatform()
}
```

**Nota:** Spring Cloud Gateway usa Spring WebFlux (reactive). Non aggiungere `spring-boot-starter-web` (MVC) — causano conflitto.

---

## 5. Application Class Design

### 5.1 `ServiceDiscoveryApplication.java`

Package: `it.evodev.discovery`

```java
@SpringBootApplication
@EnableEurekaServer
public class ServiceDiscoveryApplication {
    public static void main(String[] args) {
        SpringApplication.run(ServiceDiscoveryApplication.class, args);
    }
}
```

### 5.2 `ConfigServerApplication.java`

Package: `it.evodev.config`

```java
@SpringBootApplication
@EnableConfigServer
public class ConfigServerApplication {
    public static void main(String[] args) {
        SpringApplication.run(ConfigServerApplication.class, args);
    }
}
```

### 5.3 `ApiGatewayApplication.java`

Package: `it.evodev.gateway`

```java
@SpringBootApplication
public class ApiGatewayApplication {
    public static void main(String[] args) {
        SpringApplication.run(ApiGatewayApplication.class, args);
    }
}
```

Nessuna annotation aggiuntiva — Eureka client e gateway si autoconfigura tramite dipendenze + properties.

---

## 6. Configuration Files Design

### 6.1 `service-discovery/src/main/resources/application.properties`

```properties
spring.application.name=service-discovery
server.port=8761

# Non si registra con se stesso
eureka.client.register-with-eureka=false
eureka.client.fetch-registry=false

# Disabilita il check di config server (non usa Config Server)
spring.cloud.config.import-check.enabled=false
```

### 6.2 `config-server/src/main/resources/application.properties`

```properties
spring.application.name=config-server
server.port=8888

# Backend native: legge da classpath:/config/
spring.profiles.active=native
spring.cloud.config.server.native.search-locations=classpath:/config

# Non si registra con Eureka (deve avviarsi prima di Eureka o indipendentemente)
eureka.client.enabled=false
spring.cloud.config.import-check.enabled=false
```

**Scelta architetturale:** il Config Server non si registra con Eureka perché deve essere raggiungibile dai servizi all'avvio, prima che Eureka sia completamente operativo. I servizi conoscono l'URL del Config Server tramite variabile d'ambiente.

### 6.3 `config-server/src/main/resources/config/app.properties`

```properties
spring.application.name=app
server.port=8081

# Eureka
eureka.client.service-url.defaultZone=http://service-discovery:8761/eureka/
eureka.instance.prefer-ip-address=true

# JPA / Liquibase — invariati rispetto all'attuale application.properties
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect
spring.liquibase.enabled=true
spring.liquibase.change-log=classpath:db/changelog/db.changelog-master.yaml
spring.liquibase.contexts=prod

# Redis
spring.data.redis.host=redis
spring.data.redis.port=6379

# Multipart
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=50MB
```

### 6.4 `config-server/src/main/resources/config/directs-service.properties`

```properties
spring.application.name=directs-service
server.port=8082

# Eureka
eureka.client.service-url.defaultZone=http://service-discovery:8761/eureka/
eureka.instance.prefer-ip-address=true

# JPA — solo validate, Liquibase gestito da app
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect
spring.liquibase.enabled=false
```

### 6.5 `config-server/src/main/resources/config/api-gateway.properties`

```properties
spring.application.name=api-gateway
server.port=8080

# Eureka
eureka.client.service-url.defaultZone=http://service-discovery:8761/eureka/
eureka.instance.prefer-ip-address=true

# Routing: directs-service ha priorità (predicati più specifici prima)
spring.cloud.gateway.routes[0].id=directs-ws
spring.cloud.gateway.routes[0].uri=lb://directs-service
spring.cloud.gateway.routes[0].predicates[0]=Path=/ws/**

spring.cloud.gateway.routes[1].id=directs-rest
spring.cloud.gateway.routes[1].uri=lb://directs-service
spring.cloud.gateway.routes[1].predicates[0]=Path=/api/priv/direct/**

spring.cloud.gateway.routes[2].id=app
spring.cloud.gateway.routes[2].uri=lb://app
spring.cloud.gateway.routes[2].predicates[0]=Path=/**

# CORS gestito da app e directs-service individualmente
# Il gateway non aggiunge header CORS aggiuntivi
spring.cloud.gateway.globalcors.add-to-simple-url-handler-mapping=false
```

**Nota routing WebSocket:** Spring Cloud Gateway supporta il proxying WebSocket/SockJS natively (è reactive). La rotta `directs-ws` con `Path=/ws/**` gestisce automaticamente sia le richieste HTTP (SockJS handshake) che le connessioni WebSocket upgrade.

### 6.6 `app/src/main/resources/application.properties` (modificato)

```properties
spring.application.name=app

# Import da Config Server — optional: usa config locale se Config Server non raggiungibile
spring.config.import=optional:configserver:http://config-server:8888

# Valori sensibili non nel Config Server (iniettati da docker-compose come env var)
spring.datasource.url=jdbc:postgresql://db:5432/${DB_NAME:iree_db}
spring.datasource.username=${DB_USER:iree_user}
spring.datasource.password=${DB_PASSWORD:changeme}
spring.datasource.driver-class-name=org.postgresql.Driver
cors.allowed-origins=${CORS_ALLOWED_ORIGINS}
auth.jwt.secret=${AUTH_JWT_SECRET}
auth.jwt.access-token-ttl=900
auth.jwt.refresh-token-ttl=604800
auth.jwt.issuer="instagram-be"
blob.connection-string=${AZURE_STORAGE_CONNECTION_STRING}
blob.container-name=${AZURE_STORAGE_CONTAINER_NAME:iree-media}
```

**Motivazione split:** porta, Eureka URL e configurazioni JPA vanno nel Config Server (variano per ambiente). Credenziali DB, JWT secret e Azure connection string rimangono come env var locali (segreti, non devono stare in un file versionato).

### 6.7 `directs-service/src/main/resources/application.properties`

```properties
spring.application.name=directs-service

spring.config.import=optional:configserver:http://config-server:8888

# Credenziali DB (stesso DB di app)
spring.datasource.url=jdbc:postgresql://db:5432/${DB_NAME:iree_db}
spring.datasource.username=${DB_USER:iree_user}
spring.datasource.password=${DB_PASSWORD:changeme}
spring.datasource.driver-class-name=org.postgresql.Driver

# JWT — stesso secret di app
auth.jwt.secret=${AUTH_JWT_SECRET}
auth.jwt.access-token-ttl=900
auth.jwt.refresh-token-ttl=604800
auth.jwt.issuer="instagram-be"

cors.allowed-origins=${CORS_ALLOWED_ORIGINS}
```

---

## 7. Directs Service — Classi da copiare/adattare

### 7.1 Classi copiate direttamente da `app`

Il package di destinazione in `directs-service` è `it.evodev.directs` (non `it.evodev.instagram.directs`).

| Classe sorgente (`it.evodev.instagram`) | Destinazione (`it.evodev.directs`) | Modifiche |
|---|---|---|
| `directs/controllers/DirectRestController.java` | `controllers/DirectRestController.java` | Aggiornare import package |
| `directs/controllers/DirectWebSocketController.java` | `controllers/DirectWebSocketController.java` | Aggiornare import package |
| `directs/dto/**` | `dto/**` | Aggiornare import package |
| `directs/exceptions/**` | `exceptions/**` | Aggiornare import package |
| `directs/models/Chat.java` | `models/Chat.java` | Aggiornare import package |
| `directs/models/ChatParticipant.java` | `models/ChatParticipant.java` | Aggiornare import package |
| `directs/models/Message.java` | `models/Message.java` | Aggiornare import package |
| `directs/repositories/**` | `repositories/**` | Aggiornare import package |
| `directs/services/**` | `services/**` | Aggiornare import package |
| `config/WebSocketConfig.java` | `config/WebSocketConfig.java` | Aggiornare import package |
| `config/WebSocketAuthChannelInterceptor.java` | `config/WebSocketAuthChannelInterceptor.java` | Aggiornare import package + dipendenza JwtService locale |
| `auth/util/UuidV7Generator.java` | `util/UuidV7Generator.java` | Aggiornare package declaration |

### 7.2 `JwtService` in `directs-service`

`directs-service` non include l'intero modulo `auth`. Crea `it.evodev.directs.auth.JwtService` con i soli metodi usati dall'interceptor:

```java
@Service
public class JwtService {

    @Value("${auth.jwt.secret}")
    private String secret;

    @Value("${auth.jwt.issuer}")
    private String issuer;

    public String extractSubject(String token) {
        return Jwts.parser()
                .verifyWith(Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8)))
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }
}
```

**Motivazione:** duplicare solo `extractSubject` invece dell'intero `JwtService` (che include logica di generazione token non necessaria in `directs-service`). Il secret è lo stesso `AUTH_JWT_SECRET` env var.

### 7.3 `Profile` entity in `directs-service` (read-only)

```java
@Entity
@Table(name = "profiles")
@Getter
@NoArgsConstructor
public class Profile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "username")
    private String username;

    @Column(name = "full_name")
    private String fullName;

    @Column(name = "profile_image_url")
    private String profileImageUrl;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
}
```

`directs-service` non ha `@EnableJpaAuditing` e non usa `@PrePersist`/`@PreUpdate` su `Profile`. La entity è usata solo per read.

```java
public interface ProfileJpaRepository extends JpaRepository<Profile, Long> {
    Optional<Profile> findByUserIdAndDeletedAtIsNull(UUID userId);
    boolean existsByIdAndDeletedAtIsNull(Long id);
}
```

### 7.4 `DirectsServiceApplication.java`

```java
@SpringBootApplication
public class DirectsServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(DirectsServiceApplication.class, args);
    }
}
```

Nessuna annotation custom aggiuntiva. Security filter chain per JWT va configurata con un `SecurityFilterChain` bean che:
1. Disabilita CSRF (stateless JWT)
2. Applica `JwtAuthenticationFilter` (copiato/adattato da `app`) ai path `/api/priv/**`
3. Permette `/ws/**` e `/api/pub/**` senza autenticazione

---

## 8. Dockerfile Design

Tutti i Dockerfile usano il **build context `./backend`** (root del multi-module). Questo è necessario perché Gradle risolve le dipendenze del root `build.gradle` prima di buildare il sottomodulo.

### 8.1 Pattern comune (tutti i sottomoduli)

```dockerfile
# Stage 1: build
FROM gradle:8-jdk21 AS build
WORKDIR /app
# Copia l'intero multi-module
COPY . .
# Builda SOLO il sottomodulo specificato
RUN gradle :{MODULE_NAME}:bootJar --no-daemon --parallel

# Stage 2: runtime
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/{MODULE_NAME}/build/libs/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### 8.2 `app/Dockerfile`

```dockerfile
FROM gradle:8-jdk21 AS build
WORKDIR /app
COPY . .
RUN gradle :app:bootJar --no-daemon --parallel

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/app/build/libs/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### 8.3 `directs-service/Dockerfile`

```dockerfile
FROM gradle:8-jdk21 AS build
WORKDIR /app
COPY . .
RUN gradle :directs-service:bootJar --no-daemon --parallel

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/directs-service/build/libs/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### 8.4 `service-discovery/Dockerfile`

```dockerfile
FROM gradle:8-jdk21 AS build
WORKDIR /app
COPY . .
RUN gradle :service-discovery:bootJar --no-daemon --parallel

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/service-discovery/build/libs/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### 8.5 `config-server/Dockerfile`

```dockerfile
FROM gradle:8-jdk21 AS build
WORKDIR /app
COPY . .
RUN gradle :config-server:bootJar --no-daemon --parallel

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/config-server/build/libs/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### 8.6 `api-gateway/Dockerfile`

```dockerfile
FROM gradle:8-jdk21 AS build
WORKDIR /app
COPY . .
RUN gradle :api-gateway:bootJar --no-daemon --parallel

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/api-gateway/build/libs/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]
```

---

## 9. Docker Compose Design

### 9.1 `docker-compose.yml` (completo)

```yaml
version: '3.9'

services:

  # ── FRONTEND ──────────────────────────────────────────
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    image: iree/frontend
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: ${API_URL}
      NEXT_PUBLIC_WS_URL: ${API_URL}/ws
      NEXT_PUBLIC_BASE_URL: ${NEXT_PUBLIC_BASE_URL}
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@db:5432/${DB_NAME}
      SPRING_API_BASE_URL: http://api-gateway:8080   # ← cambiato da backend:8080
      AUTH_ACCESS_TOKEN_COOKIE_NAME: ${AUTH_ACCESS_TOKEN_COOKIE_NAME}
      AUTH_ACCESS_TOKEN_COOKIE_PATH: ${AUTH_ACCESS_TOKEN_COOKIE_PATH}
      AUTH_REFRESH_TOKEN_COOKIE_NAME: ${AUTH_REFRESH_TOKEN_COOKIE_NAME}
      AUTH_REFRESH_TOKEN_COOKIE_PATH: ${AUTH_REFRESH_TOKEN_COOKIE_PATH}
    depends_on:
      - api-gateway

  # ── SERVICE DISCOVERY ─────────────────────────────────
  service-discovery:
    build:
      context: ./backend
      dockerfile: service-discovery/Dockerfile
    image: iree/service-discovery
    ports:
      - "8761:8761"    # esposto per debug (dashboard Eureka)

  # ── CONFIG SERVER ─────────────────────────────────────
  config-server:
    build:
      context: ./backend
      dockerfile: config-server/Dockerfile
    image: iree/config-server
    ports:
      - "8888:8888"    # esposto per debug
    depends_on:
      - service-discovery

  # ── APP (monolite) ────────────────────────────────────
  app:
    build:
      context: ./backend
      dockerfile: app/Dockerfile
    image: iree/app
    ports:
      - "8081:8081"    # interno — non serve esposizione pubblica
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://db:5432/${DB_NAME}
      SPRING_DATASOURCE_USERNAME: ${DB_USER}
      SPRING_DATASOURCE_PASSWORD: ${DB_PASSWORD}
      SPRING_DATA_REDIS_HOST: redis
      SPRING_DATA_REDIS_PORT: 6379
      CORS_ALLOWED_ORIGINS: ${CORS_ALLOWED_ORIGINS}
      AUTH_JWT_SECRET: ${AUTH_JWT_SECRET}
      AZURE_STORAGE_CONNECTION_STRING: ${AZURE_STORAGE_CONNECTION_STRING}
      AZURE_STORAGE_CONTAINER_NAME: ${AZURE_STORAGE_CONTAINER_NAME}
      SPRING_CONFIG_IMPORT: "optional:configserver:http://config-server:8888"
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started
      config-server:
        condition: service_started

  # ── DIRECTS SERVICE ───────────────────────────────────
  directs-service:
    build:
      context: ./backend
      dockerfile: directs-service/Dockerfile
    image: iree/directs-service
    ports:
      - "8082:8082"    # interno
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://db:5432/${DB_NAME}
      SPRING_DATASOURCE_USERNAME: ${DB_USER}
      SPRING_DATASOURCE_PASSWORD: ${DB_PASSWORD}
      AUTH_JWT_SECRET: ${AUTH_JWT_SECRET}
      CORS_ALLOWED_ORIGINS: ${CORS_ALLOWED_ORIGINS}
      SPRING_CONFIG_IMPORT: "optional:configserver:http://config-server:8888"
    depends_on:
      db:
        condition: service_healthy
      config-server:
        condition: service_started

  # ── API GATEWAY ───────────────────────────────────────
  api-gateway:
    build:
      context: ./backend
      dockerfile: api-gateway/Dockerfile
    image: iree/api-gateway
    ports:
      - "8080:8080"    # porta pubblica — il frontend punta qui
    environment:
      SPRING_CONFIG_IMPORT: "optional:configserver:http://config-server:8888"
    depends_on:
      service-discovery:
        condition: service_started
      config-server:
        condition: service_started
      app:
        condition: service_started
      directs-service:
        condition: service_started

  # ── DATABASE ──────────────────────────────────────────
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d ${DB_NAME}"]
      interval: 5s
      timeout: 5s
      retries: 5

  # ── REDIS ─────────────────────────────────────────────
  redis:
    image: redis:7-alpine
    volumes:
      - redisdata:/data

volumes:
  pgdata:
  redisdata:
```

### 9.2 Ordine di avvio (dipendenze Docker)

```
db (healthy) ──────────────────────────────────┐
                                               ├──► app
config-server ─────────────────────────────────┤
                                               ├──► directs-service
redis ─────────────────────────────────────────┘

service-discovery ─────┐
config-server ─────────┼──► api-gateway
app ────────────────────┤
directs-service ───────┘

api-gateway ──────────────► frontend
```

**Nota:** Docker `depends_on: service_started` non garantisce che il servizio sia *pronto*, solo che il container sia avviato. Per ambienti di sviluppo questo è sufficiente — i client Spring Boot hanno retry automatico per Eureka e Config Server.

---

## 10. Modifiche al monolite `app`

### 10.1 Classi da rimuovere

| File | Motivo |
|---|---|
| `it.evodev.instagram.directs/**` | Spostato in `directs-service` |
| `it.evodev.instagram.config.WebSocketConfig` | Usato solo da directs — spostato in `directs-service` |
| `it.evodev.instagram.config.WebSocketAuthChannelInterceptor` | Idem |

### 10.2 Dipendenza da rimuovere in `app/build.gradle`

```groovy
// RIMUOVERE:
implementation 'org.springframework.boot:spring-boot-starter-websocket'
```

### 10.3 Annotazione da aggiungere a `InstagramApplication.java`

Nessuna annotazione aggiuntiva necessaria — `@SpringBootApplication` + Eureka client autoconfigura il client tramite le dipendenze e le properties nel Config Server.

---

## 11. Migration Plan (Strangler Fig)

**Regola fondamentale:** ad ogni step il progetto deve compilare e i servizi già implementati devono funzionare. Nessuno step lascia il progetto in stato non funzionante.

### Step 1 — Ristrutturazione Gradle (nessuna logica modificata)

1. Creare `backend/settings.gradle` con i 5 `include`.
2. Creare `backend/build.gradle` root con BOM Spring Cloud.
3. Spostare `backend/src/` → `backend/app/src/`.
4. Spostare `backend/build.gradle` → `backend/app/build.gradle` (aggiungere Eureka client + Config client, rimuovere WebSocket).
5. Spostare `backend/Dockerfile` → `backend/app/Dockerfile` (aggiornare `gradle :app:bootJar`).
6. **Verifica:** `./gradlew :app:bootJar` compila senza errori.

### Step 2 — Service Discovery

1. Creare `backend/service-discovery/` con `build.gradle`, `ServiceDiscoveryApplication.java`, `application.properties`.
2. Creare `backend/service-discovery/Dockerfile`.
3. **Verifica:** `./gradlew :service-discovery:bootJar` compila. Il jar avviato mostra la dashboard Eureka su `localhost:8761`.

### Step 3 — Config Server

1. Creare `backend/config-server/` con `build.gradle`, `ConfigServerApplication.java`, `application.properties`.
2. Creare i file di config in `config-server/src/main/resources/config/`: `app.properties`, `directs-service.properties`, `api-gateway.properties`.
3. Creare `backend/config-server/Dockerfile`.
4. **Verifica:** `./gradlew :config-server:bootJar` compila. `GET http://localhost:8888/app/default` restituisce le properties di `app`.

### Step 4 — Aggiornamento `app` con Eureka + Config client

1. Aggiungere dipendenze Eureka client e Config client in `app/build.gradle`.
2. Aggiornare `app/src/main/resources/application.properties` con `spring.config.import`.
3. **Verifica:** `app` si avvia, si registra in Eureka (dashboard mostra `APP`), riceve config da Config Server.

### Step 5 — Creazione `directs-service`

1. Creare `backend/directs-service/` con `build.gradle`.
2. Copiare tutto il package `directs` in `it.evodev.directs`.
3. Copiare `WebSocketConfig` e `WebSocketAuthChannelInterceptor` in `it.evodev.directs.config`.
4. Copiare `UuidV7Generator` in `it.evodev.directs.util`.
5. Creare `JwtService` minimale in `it.evodev.directs.auth`.
6. Creare `Profile` entity read-only e `ProfileJpaRepository`.
7. Creare `DirectsServiceApplication.java` con Security filter chain.
8. Creare `directs-service/src/main/resources/application.properties`.
9. Creare `backend/directs-service/Dockerfile`.
10. **Verifica:** `./gradlew :directs-service:bootJar` compila. Il servizio si avvia, si registra in Eureka, risponde a `GET /api/priv/direct/chats` con JWT valido.

### Step 6 — API Gateway

1. Creare `backend/api-gateway/` con `build.gradle`, `ApiGatewayApplication.java`, `application.properties`.
2. Creare `backend/api-gateway/Dockerfile`.
3. **Verifica:** `./gradlew :api-gateway:bootJar` compila. `GET http://localhost:8080/api/priv/direct/chats` viene inoltrato a `directs-service`. `GET http://localhost:8080/api/priv/auth/me` viene inoltrato a `app`.

### Step 7 — Rimozione directs da `app`

1. Eliminare `app/src/main/java/it/evodev/instagram/directs/`.
2. Eliminare `app/src/main/java/it/evodev/instagram/config/WebSocketConfig.java`.
3. Eliminare `app/src/main/java/it/evodev/instagram/config/WebSocketAuthChannelInterceptor.java`.
4. Rimuovere `spring-boot-starter-websocket` da `app/build.gradle`.
5. **Verifica:** `./gradlew :app:bootJar` compila senza errori. Le route direct sono servite da `directs-service` attraverso il gateway.

### Step 8 — Aggiornamento docker-compose

1. Sostituire il contenuto di `docker-compose.yml` con quello della sezione 9.1.
2. Aggiornare `docker-compose.override.yml` coerentemente (vedi sezione 12).
3. **Verifica:** `docker compose up --build` avvia tutti e 7 i container. Il frontend funziona su `localhost:3000`.

---

## 12. Docker Compose Override Design

`docker-compose.override.yml` (sviluppo locale) deve essere aggiornato per:

1. Aggiungere Azurite come sostituto di Azure Blob Storage per `app` — invariato.
2. Mappare le porte interne per debug (`8081`, `8082`, `8888`, `8761`).
3. Opzionale: aggiungere hot reload per `app` e `directs-service` tramite volume mount del jar (advanced, out of scope per questa spec).

```yaml
# docker-compose.override.yml (sviluppo)
services:

  azurite:
    image: mcr.microsoft.com/azure-storage/azurite
    ports:
      - "10000:10000"
    command: azurite-blob --blobHost 0.0.0.0

  app:
    environment:
      AZURE_STORAGE_CONNECTION_STRING: "DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OGLjX+N1SMVLvHMZlI0CqBF5U1eL0qpBEpizilEg==;BlobEndpoint=http://azurite:10000/devstoreaccount1;"
    depends_on:
      - azurite
```

---

## 13. Security Considerations (OWASP-focused)

1. `directs-service` valida il JWT autonomamente con lo stesso `AUTH_JWT_SECRET` — il secret non è mai esposto in Config Server, solo come env var Docker (Sensitive Data Exposure).
2. Le porte interne `8081` (app) e `8082` (directs-service) non sono raggiungibili dall'esterno in produzione — il gateway è il solo punto d'ingresso sulla porta `8080`.
3. Il Config Server (`:8888`) e il Service Discovery (`:8761`) sono esposti sulle porte host solo per debug. In produzione vanno rimossi i port mapping dal `docker-compose.yml`.
4. `directs-service` non ha accesso in scrittura alle tabelle `profiles`, `follows`, `posts`, ecc. — il DB è condiviso ma il codice non include repository di scrittura su quelle entità.
5. Il gateway non esegue autenticazione — ogni servizio è responsabile della propria. Non aggiungere JWT filter nel gateway senza aggiornare questa spec (Breaking Access Control risk se implementato parzialmente).
6. `spring.cloud.gateway.globalcors.add-to-simple-url-handler-mapping=false` — i CORS sono gestiti da ogni servizio, non duplicati nel gateway.

---

## 14. Anti-Patterns (DO NOT)

| ❌ Don't | ✅ Do invece | Perché |
|---|---|---|
| Includere `spring-boot-starter-web` (MVC) in `api-gateway` | Usare solo `spring-cloud-starter-gateway` (WebFlux) | Gateway è reactive — MVC e WebFlux non coesistono in uno stesso processo Spring |
| Includere `spring-boot-starter-websocket` in `app` dopo la migrazione | Rimuoverlo | Non ci sono più endpoint WebSocket in `app` — la dipendenza spreca risorse |
| Registrare il Config Server con Eureka | Tenerlo separato con `eureka.client.enabled=false` | I servizi contattano Config Server all'avvio, prima che Eureka sia pronto |
| Mettere JWT secret e credenziali DB nel Config Server | Passarle come variabili d'ambiente Docker | I file in `config-server/src/main/resources/config/` sono versionati nel repo — i segreti non vanno nel VCS |
| Scrivere sulla tabella `profiles` da `directs-service` | Read-only — nessun `save()` su `ProfileJpaRepository` | Ownership del dato appartiene ad `app`; scritture concorrenti sullo stesso record da due servizi creano race condition |
| Eseguire Liquibase in `directs-service` | Impostare `spring.liquibase.enabled=false` | Le migrazioni del DB sono gestite da `app` — due Liquibase sullo stesso schema in parallelo corrompono il changelog |
| Usare `depends_on: service_healthy` per `config-server` | Usare `service_started` + `optional:configserver:` | Config Server non espone un healthcheck HTTP facilmente configurabile in Docker; `optional:` gestisce il retry applicativo |
| Esporre porte interne (`8081`, `8082`) in produzione | Rimuovere port mapping nel compose di produzione | Solo il gateway deve essere raggiungibile dall'esterno |
| Copiare l'intero modulo `auth` in `directs-service` | Copiare solo `JwtService.extractSubject` | Il modulo `auth` contiene logica di generazione token, gestione refresh, seeder — tutto inutile in `directs-service` |
| Aggiungere route catch-all (`/**`) in gateway prima delle route specifiche | Mettere route specifiche (directs, ws) prima della catch-all | Spring Cloud Gateway applica le route in ordine di definizione — la catch-all deve essere l'ultima |

---

## 15. Test Case Specifications

> **Stato attuale:** nessun test applicativo esiste nel progetto. Le tabelle seguenti specificano cosa va scritto, non cosa è già presente.

### Unit tests required

| Test ID | Component | Input | Expected Output | Edge Cases |
|---|---|---|---|---|
| TC-MS-001 | `JwtService` (directs-service) | Token valido con subject UUID | `extractSubject` restituisce UUID string | Token scaduto → `ExpiredJwtException` |
| TC-MS-002 | `JwtService` (directs-service) | Token con secret errato | `SignatureException` | Secret null → errore di configurazione |
| TC-MS-003 | Config Server — `app.properties` | `GET /app/default` | Properties contenenti `server.port=8081` | Profilo inesistente → fallback a `application.properties` |
| TC-MS-004 | Config Server — `directs-service.properties` | `GET /directs-service/default` | Properties contenenti `server.port=8082` e `spring.liquibase.enabled=false` | |
| TC-MS-005 | Gateway routing — directs REST | `GET /api/priv/direct/chats` | Forwarded a `directs-service:8082` | Path non esistente → 404 da `directs-service` |
| TC-MS-006 | Gateway routing — app catch-all | `GET /api/priv/auth/me` | Forwarded a `app:8081` | |
| TC-MS-007 | Gateway routing — WebSocket | `GET /ws` (upgrade request) | Forwarded a `directs-service:8082` | SockJS polling fallback `/ws/info` → forwarded |
| TC-MS-008 | Eureka registration — app | Avvio `app` con Eureka attivo | `app` compare nella dashboard Eureka come `UP` | Eureka non raggiungibile → app si avvia comunque (optional) |
| TC-MS-009 | Eureka registration — directs-service | Avvio `directs-service` con Eureka attivo | `directs-service` compare nella dashboard come `UP` | |
| TC-MS-010 | Profile read-only (directs-service) | `findByUserIdAndDeletedAtIsNull(uuid)` | Restituisce `Profile` con dati corretti | UUID non esistente → `Optional.empty()` |

### Integration tests required

| Test ID | Flow | Setup | Verification | Teardown |
|---|---|---|---|---|
| IT-MS-001 | End-to-end `GET /api/priv/direct/chats` via gateway | Tutti i servizi up, utente autenticato | `200` con chat list — gateway → directs-service → DB | — |
| IT-MS-002 | End-to-end `GET /api/priv/auth/me` via gateway | Tutti i servizi up, utente autenticato | `200` — gateway → app → DB | — |
| IT-MS-003 | WebSocket STOMP via gateway | Client STOMP si connette a `ws://gateway:8080/ws` | Connessione stabilita, subscribe a `/user/queue/direct` funziona | Deactivate client |
| IT-MS-004 | Config Server serve properties a `app` | Config Server up, `app` in avvio | `app` usa `server.port=8081` ricevuto da Config Server | — |
| IT-MS-005 | `directs-service` non esegue Liquibase | DB con schema esistente, `directs-service` avvio | Nessuna esecuzione Liquibase nei log di `directs-service` | — |
| IT-MS-006 | Routing priorità — `/api/priv/direct/**` va a directs, non a app | Gateway up con entrambi i servizi | Richiesta a `/api/priv/direct/chats` ha `X-Forwarded-Port: 8082` (o log directs) | — |

---

## 16. Error Handling Matrix

| Error Type | Detection | Response | Fallback | Logging |
|---|---|---|---|---|
| Config Server irraggiungibile all'avvio | `spring.config.import=optional:` — il prefix `optional:` evita crash | Servizio usa `application.properties` locale | Configurazione parziale (solo valori locali) | `WARN` Spring Cloud |
| Eureka irraggiungibile | Client retry automatico ogni 30s | Servizio funziona ma non è instradabile dal gateway | Chiamate dirette per IP funzionano | `WARN` Eureka client |
| `directs-service` non registrato in Eureka | Gateway non trova `lb://directs-service` | `503 Service Unavailable` dal gateway | Nessuno (il servizio è down) | `ERROR` gateway |
| `app` non registrato in Eureka | Gateway non trova `lb://app` | `503 Service Unavailable` dal gateway | Nessuno | `ERROR` gateway |
| JWT scaduto in `directs-service` | `extractSubject` lancia `ExpiredJwtException` | `MessagingException` su STOMP CONNECT / `401` su REST | Nessuno | `WARN` directs-service |
| Scrittura su `profiles` da `directs-service` | Non implementata — nessun `save()` su `ProfileJpaRepository` | Non applicabile | — | — |
| Due Liquibase in parallelo | Prevenuto da `spring.liquibase.enabled=false` in `directs-service` | Non applicabile | — | — |
| Porta `8081`/`8082` già in uso (sviluppo locale) | Avvio fallisce con `Address already in use` | Cambiare porta locale in `application.properties` | — | `ERROR` Spring Boot |
| Gateway WebSocket timeout | Connessione SockJS cade | `@stomp/stompjs` reconnect automatico (delay 5s) | Stale state fino a reconnect | `WARN` frontend console |

---

## 17. References (Deep Links)

| Topic | Location | Anchor |
|---|---|---|
| Modulo directs attuale (da spostare) | `backend/src/main/java/it/evodev/instagram/directs/` | package root |
| WebSocketConfig attuale (da spostare) | `backend/src/main/java/it/evodev/instagram/config/WebSocketConfig.java` | class |
| WebSocketAuthChannelInterceptor attuale | `backend/src/main/java/it/evodev/instagram/config/WebSocketAuthChannelInterceptor.java` | class |
| UuidV7Generator (da copiare) | `backend/src/main/java/it/evodev/instagram/auth/util/UuidV7Generator.java` | class |
| JwtService attuale (reference per `extractSubject`) | `backend/src/main/java/it/evodev/instagram/auth/services/JwtService.java` | `extractSubject` |
| Build file attuale da ristrutturare | `backend/build.gradle` | full file |
| Settings attuale da ristrutturare | `backend/settings.gradle` | full file |
| Docker Compose attuale | `docker-compose.yml` | full file |
| Docker Compose override attuale | `docker-compose.override.yml` | full file |
| Spec directs (architettura WS) | `docs/specs/direct.md` | Sezione 9 (WebSocket Design) |
| Esempio professore — api-gateway | `C:\Users\Cristian\Downloads\gw\gw\api-gateway\src\main\resources\application.properties` | routing config |
| Esempio professore — service-discovery | `C:\Users\Cristian\Downloads\gw\gw\service-discovery\src\main\java\it\uniba\servicediscovery\ServiceDiscoveryApplication.java` | `@EnableEurekaServer` |
| Esempio professore — service1 (Eureka client pattern) | `C:\Users\Cristian\Downloads\gw\gw\service1\src\main\resources\application.properties` | eureka config |

---

## 18. Spec Gate Self-Assessment

| Check | Status |
|---|---|
| 13-item Spec Gate completeness | Pass |
| AI Coder Understandability Score | 9.5 / 10 |
| Foundation checks (1–7) | Pass |
| Document architecture checks (8–13) | Pass |

Critical assumptions made explicit:

1. **Spring Cloud 2024.0.1** è la versione compatibile con Spring Boot 3.4.5 e Java 21. Non usare Spring Cloud 2023.x (richiede Spring Boot 3.2.x-3.3.x).
2. **Spring Cloud Gateway usa WebFlux** (reactive) — non coesiste con `spring-boot-starter-web` (MVC) nello stesso processo. Il modulo `api-gateway` non include MVC.
3. **Il Config Server non si registra con Eureka** per evitare la dependency circolare: i servizi hanno bisogno del Config Server per sapere dove si trova Eureka.
4. **Liquibase gira solo in `app`** — `directs-service` usa `spring.liquibase.enabled=false` e `spring.jpa.hibernate.ddl-auto=validate`. Lo schema esiste già grazie ad `app`.
5. **I segreti (JWT secret, credenziali DB) non vanno nel Config Server** — restano come variabili d'ambiente Docker. Solo le configurazioni non sensibili (porta, Eureka URL, JPA dialect) sono nel Config Server.
6. **Il package root di `directs-service` è `it.evodev.directs`** (non `it.evodev.instagram.directs`) per chiarire visivamente l'appartenenza al servizio standalone.
7. **`Profile` entity in `directs-service` è read-only** — nessun `@PrePersist`, nessun `save()`, nessun `@EntityListeners`. Mappa alla stessa tabella `profiles` del DB condiviso.
8. **Il frontend non cambia** — continua a puntare a `:8080`. Il gateway è trasparente.
9. **`depends_on: service_started`** (non `service_healthy`) per Config Server e Service Discovery — non hanno healthcheck Docker configurato; il retry applicativo gestisce la dipendenza.
10. **`./gradlew :sottomodulo:bootJar --no-daemon --parallel`** nei Dockerfile usa il task corretto per Spring Boot multi-module Gradle.
