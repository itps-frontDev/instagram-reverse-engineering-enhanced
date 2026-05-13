# Backend — Spring Boot (Dettaglio)

> Richiamare con `@file:.github/instructions/backend.instructions.md`
> quando si lavora su codice backend.

---

## Regole fondamentali

- Java con Spring Boot; ogni modulo CORE isolato nella propria cartella
- Migrazioni database esclusivamente tramite Liquibase — mai modificare il DB manualmente
- I repository in `frontend/src/repositories/*` contengono raw query SQL di riferimento
  per implementare le query equivalenti nei repository Spring Boot

---

## Workflow obbligatorio per ogni nuovo modulo CORE

Seguire rigorosamente questo ordine:

1. **Model** — entità JPA annotata con `@Entity`, `@Table`, `@Id`; UUID come PK;
   mappare tutte le colonne Liquibase; includere sempre `createdAt` e `updatedAt`

2. **Controller** — `@RestController` + `@RequestMapping`; zero logica di business
   (delega tutto al service); loggare ogni endpoint con `logger.info` (metodo HTTP,
   path, parametri); documentare con commento il perché del metodo HTTP e del path;
   usare `Authentication`/`@AuthenticationPrincipal` solo per endpoint viewer-specific

3. **Service** — creare interfaccia + implementazione; tutta la business logic vive
   qui; chiamare il repository per l'accesso ai dati; mai chiamate DB dirette fuori
   dal repository

4. **Repository** — estende `JpaRepository`; usare JPQL o query methods come
   riferimento dalle raw query SQL legacy; mai SQL concatenato come stringa,
   sempre parametri named (`@Query` con `:param`)

5. **Classi accessorie**
   - DTO: mai esporre l'entità JPA direttamente all'esterno
   - Eccezioni: classi custom che estendono `RuntimeException`, gestite da
     `@ControllerAdvice` globale con response strutturata `{ success, data?, error?, message? }`
   - Config: bean, costanti, security config specifici del modulo

6. **Struttura cartelle**
   ```
   [modulo]/
   ├── controller/
   ├── service/
   │   └── impl/
   ├── repository/
   ├── model/
   ├── dto/
   │   ├── request/
   │   └── response/
   ├── exception/
   └── config/   (se necessario)
   ```

7. **Postman** — aggiornare `/postman` con le nuove chiamate API seguendo struttura
   e naming esistenti; includere esempi request/response; aggiungere variabili
   d'ambiente per baseUrl e token

---

## Struttura multi-controller

Quando un controller supera ~150 righe, suddividere per responsabilità funzionale.
Esempio per `profile`:

```
controller/
├── ProfileController.java        ← GET profilo, preview, can-view
├── ProfileEditController.java    ← PUT edit, personal, birthday, privacy, security
└── FollowController.java         ← POST follow, unfollow, accept, reject
service/
├── ProfileService.java           ← lettura profilo, canViewProfile()
├── ProfileEditService.java       ← aggiornamento campi
├── FollowService.java            ← follow/unfollow/accept/reject
└── impl/
    ├── ProfileServiceImpl.java
    ├── ProfileEditServiceImpl.java
    └── FollowServiceImpl.java
```

Regole:
- I controller dello stesso modulo condividono i Service via dependency injection
- I metodi riutilizzabili (es. `canViewProfile()`) vivono nel Service principale,
  chiamati dagli altri Service — mai direttamente dai controller

---

## Logging obbligatorio

Ogni classe (Controller, Service, Repository) dichiara:

```java
private static final Logger logger = LoggerFactory.getLogger(NomeClasse.class);
```

| Livello          | Quando usarlo                                                        |
|------------------|----------------------------------------------------------------------|
| `logger.info`    | Inizio e fine di ogni metodo pubblico, parametri principali, esito   |
| `logger.warn`    | Risorsa non trovata, parametro opzionale assente, accesso negato     |
| `logger.error`   | Eccezioni catturate, errori integrazione, fallimenti query            |

```java
logger.info("Fetching product with id: {}", id);
logger.warn("Product not found for id: {}", id);
logger.error("Failed to fetch product with id: {}. Error: {}", id, e.getMessage());
```

Regole: mai loggare password/token/secret; usare placeholder `{}` SLF4J,
mai concatenazione di stringhe; il `@ControllerAdvice` logga sempre con
`logger.error` prima di costruire la response.

---

## Sicurezza — OWASP Top 10

- **SQL Injection**: solo query parametrizzate JPA/JPQL, mai string concatenation
- **Broken Access Control**: ogni service verifica ownership prima di restituire
  o modificare una risorsa
- **IDOR**: UUID come PK su tutte le entità
- **Sensitive Data Exposure**: secret solo in env var; mai stack trace nella response;
  mai loggare token o password
- **Brute Force**: rate limiting sugli endpoint di autenticazione

---

## Gestione degli errori

- Eccezioni custom per modulo che estendono `RuntimeException`
- `@ControllerAdvice` globale intercetta tutto e restituisce:
  `{ success, data?, error?, message? }`
- Logga sempre con `logger.error` prima di costruire la response
- Mai esporre stack trace o dettagli interni al client
