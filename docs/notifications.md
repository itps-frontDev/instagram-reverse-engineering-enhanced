Seguendo rigorosamente le convenzioni architetturali, stilistiche e documentali già presenti nel progetto, realizza una nuova specifica tecnica chiamata:

docs/specs/notifications.md

La nuova specs deve rispettare ESATTAMENTE:
- docs copy/specs/*
- docs/specs/auth.md
- le convenzioni presenti in copilot-instructions.md
- l’approccio stream-coding già utilizzato nel progetto

L’obiettivo è migrare completamente la gestione delle notifiche attualmente implementata in Next.js verso Spring Boot, mantenendo coerenza totale con il modulo auth.

==================================================
CONTESTO PROGETTO
==================================================

Backend Java:
C:\Users\Cristian\Documents\GitHub\instagram-reverse-engineering-enhanced\backend\src\main\java\it\evodev\instagram

Frontend Next.js:
C:\Users\Cristian\Documents\GitHub\instagram-reverse-engineering-enhanced\frontend

Repository frontend attuale notifiche:
frontend\src\repositories\NotificationRepository.ts

Endpoint API Next.js attuali:
frontend\src\app\api\notifications

Modulo di riferimento backend:
backend\src\main\java\it\evodev\instagram\auth

Modulo di riferimento frontend:
frontend\src\features\auth

==================================================
OBIETTIVO
==================================================

Creare un nuovo modulo backend Spring Boot chiamato:

it.evodev.instagram.notifications

che segua ESATTAMENTE la stessa struttura, organizzazione, naming convention, logging strategy, gestione errori, separazione responsabilità e stile architetturale del modulo auth.

La logica esistente in Next.js dovrà essere estratta e migrata nel backend Spring Boot.

==================================================
STRUTTURA BACKEND DA CREARE
==================================================

Creare la cartella:

backend/src/main/java/it/evodev/instagram/notifications

con la seguente struttura:

- config
- controllers
- dto
- exceptions
- models
- repositories
- services
- strategies
- util

seguendo la stessa organizzazione interna del modulo auth.

==================================================
CONTROLLER
==================================================

I controller devono:
- essere sotto route /priv/*
- essere compatibili con Spring Security
- seguire naming e logging strategy del modulo auth
- utilizzare DTO request/response
- non contenere business logic
- delegare tutto ai services

==================================================
MODELS
==================================================

I model devono:
- utilizzare Hibernate/JPA
- seguire lo stesso approccio entity/model usato in auth
- avere relazioni correttamente modellate
- includere auditing/timestamp se coerente con il progetto
- utilizzare enum dove necessario

==================================================
REPOSITORIES
==================================================

I repository devono:
- seguire lo stile del modulo auth
- utilizzare Spring Data JPA
- includere custom query solo se realmente necessarie
- essere ottimizzati per performance e leggibilità

==================================================
SERVICES
==================================================

I services devono:
- contenere tutta la business logic
- utilizzare transaction management dove necessario
- essere facilmente estendibili
- seguire SOLID principles
- utilizzare logger strutturati

==================================================
GESTIONE ERRORI
==================================================

Creare eccezioni custom dedicate nel package:
notifications.exceptions

Seguire esattamente:
- naming convention
- struttura
- gestione centralizzata
- logging
- response format

già presenti nel modulo auth.

==================================================
STRATEGY PATTERN
==================================================

ATTENZIONE:
La gestione notifiche NON deve utilizzare molteplici metodi separati come attualmente presente nel frontend.

Implementare invece uno Strategy Pattern.

Creare:

- NotificationStrategy (interfaccia base)
- strategy implementative separate per ogni tipo notifica

Tipologie richieste:

- like_post
- like_comment
- like_story
- comment
- comment_reply
- follow
- follow_request
- follow_accepted
- mention_post
- mention_comment
- mention_story
- tag
- message
- story_view

Ogni strategy deve:
- essere indipendente
- essere facilmente estendibile
- rispettare SRP
- contenere solo la logica specifica della notifica
- essere orchestrata da un service centrale

Valutare utilizzo di:
- factory pattern
- strategy registry
- enum mapping

per evitare switch-case giganteschi.

==================================================
FRONTEND FEATURES
==================================================

Creare:

frontend/src/features/notifications

con:

- action.ts
- schema.ts
- index.ts

Seguendo ESATTAMENTE:
- struttura
- naming
- stile commenti
- organizzazione
- validazioni
- server actions

presenti nel modulo:

frontend/src/features/auth

==================================================
SCHEMA VALIDAZIONE
==================================================

In schema.ts:
- utilizzare zod
- creare validazioni input/output
- tipizzare correttamente tutte le response
- mantenere naming coerente con backend DTO

==================================================
SERVER ACTIONS
==================================================

In action.ts:
- implementare chiamate agli endpoint Spring Boot
- rimuovere dipendenze dagli endpoint Next.js legacy
- seguire lo stesso pattern del modulo auth
- centralizzare gestione errori

==================================================
POSTMAN
==================================================

Creare:

postman/collections/notifications

contenente tutte le collection relative ai nuovi endpoint Spring Boot.

Ogni endpoint deve includere:
- esempio request
- esempio response
- eventuali error cases
- autenticazione se necessaria

==================================================
FASE DI MIGRAZIONE
==================================================

Dopo la creazione degli endpoint Spring Boot:

1. sostituire nel frontend le chiamate legacy Next.js
2. migrare completamente NotificationRepository
3. eliminare codice obsoleto
4. ripulire endpoint non più utilizzati
5. evitare duplicazione logica frontend/backend

==================================================
REQUISITI IMPORTANTI
==================================================

Tutto il codice deve:
- essere production-ready
- seguire stream-coding principles
- essere altamente leggibile
- evitare over-engineering
- essere facilmente estendibile
- mantenere forte separazione responsabilità
- utilizzare logger ovunque necessario
- seguire rigorosamente le convenzioni del progetto

==================================================
OUTPUT ATTESO
==================================================

La specs notifications.md deve contenere:

- obiettivi
- architettura
- struttura cartelle
- flow applicativo
- strategy pattern design
- entity design
- endpoint design
- DTO design
- migration plan
- cleanup plan
- security considerations
- validation strategy
- error handling strategy
- frontend integration
- postman integration
- future extensibility notes

La specs deve essere estremamente dettagliata e pronta per implementazione diretta.