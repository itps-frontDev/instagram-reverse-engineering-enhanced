# 01 — Stato Iniziale: Il Monolite Next.js

[← Torna all'indice](../README.md)

---

## Caratteristiche dell'architettura originale

L'applicazione originale, disponibile nella repo `instagram-reverse-engineering`, era una **Single Page Application full-stack in Next.js** con le seguenti caratteristiche:

- **Frontend e backend nello stesso progetto** — le API routes di Next.js fungevano da backend, rendendo impossibile scalare i due livelli in modo indipendente.
- **SQLite3 come database** — database file-based embedded nel processo Node.js, non adatto a concorrenza o ambienti distribuiti.
- **Logica di business nelle Server Actions** — il flusso era verticale e accoppiato: `UI → Server Action → Repository → SQLite`.
- **Chat diretti con polling HTTP** — i messaggi venivano aggiornati tramite richieste HTTP ripetute ogni N secondi, con alta latenza e spreco di connessioni.
- **Nessun versionamento del database** — lo schema era definito staticamente, senza storia delle modifiche.
- **Nessuna containerizzazione** — ambiente non riproducibile tra sviluppo e produzione.

---

## Struttura directory del monolite

```text
instagram-reverse-engineering/
├── src/
│   ├── app/
│   │   ├── (auth)/                  # Login, Register
│   │   ├── (main)/                  # Feed, Esplora, Reels, Profilo, Direct
│   │   └── api/                     # Backend: API Routes Next.js
│   │       ├── auth/
│   │       ├── direct/              # Polling HTTP per i messaggi
│   │       ├── feed/
│   │       ├── notifications/
│   │       ├── posts/
│   │       ├── profiles/
│   │       ├── reels/
│   │       ├── search/
│   │       └── stories/
│   ├── components/                  # Componenti React
│   ├── repositories/                # Data Access Layer (SQLite)
│   ├── db/                          # Definizione schema SQLite
│   │   └── seeds/
│   └── lib/                         # Utility
└── package.json
```

---

## Limiti identificati

| Limite | Impatto |
| :--- | :--- |
| **SQLite non concorrente** | Impossibile servire richieste parallele in scenari di carico reale |
| **Frontend/Backend accoppiati** | Impossibile scalare i due livelli in modo indipendente |
| **Polling per i Direct** | Alta latenza, spreco di connessioni HTTP, esperienza utente degradata |
| **Nessun versionamento schema** | Ogni modifica al DB richiedeva un reset manuale |
| **Nessuna containerizzazione** | Ambiente non riproducibile, onboarding difficile |

---

[Architettura Finale →](02-architettura.md)
