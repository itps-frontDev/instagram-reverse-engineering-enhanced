# 📸 Instagram Reverse Engineering (Progetto Accademico)

[![Team Badge](https://img.shields.io/badge/Team-itps--frontdev-blueviolet)](https://github.com/itps-frontdev)
[![License](https://img.shields.io/badge/License-All%20Rights%20Reserved-red)](LICENSE)
[![Status](https://img.shields.io/badge/Status-In%20Development-green)](/projects)

**Obiettivo:** Progetto universitario di Programmazione Web mirato alla reverse engineering didattica di Instagram per replicarne l'architettura e l'interfaccia.

---

## 🎯 Obiettivi e Finalità del Progetto

Il progetto ha lo scopo di applicare concetti fondamentali dello sviluppo Full-Stack attraverso la ricostruzione funzionale di una piattaforma complessa.

- **Fedeltà UI/UX:** Sviluppare un'applicazione che replichi la **fedele rappresentazione** dell'interfaccia utente (UI) e l'esperienza utente (UX) di Instagram, con colori e spacing identici all'originale.
- **Obiettivo Didattico:** Comprendere le logiche operative, l'architettura e il flusso di dati di un moderno social network.
- **Ambito Legale:** Il codice è **interamente originale** e non utilizza API o risorse proprietarie di Instagram.

## 🛠️ Stack Tecnologico

| Componente             | Tecnologia                 | Descrizione                                                                 |
| :--------------------- | :------------------------- | :-------------------------------------------------------------------------- |
| **Frontend/Backend**   | **Next.js 16** & **TypeScript** | Framework full-stack con App Router, Server/Client Components           |
| **Styling**            | **Tailwind CSS v4**        | Utility-first CSS con design tokens Instagram-compliant                    |
| **Database**           | **SQLite3**                | Database relazionale embedded per sviluppo rapido e portabilità             |
| **Autenticazione**     | **JWT + bcrypt**           | Token JWT in HTTP-only cookies, password hashate con bcrypt                 |
| **State Management**   | **React Context**          | AuthContext per condivisione stato utente globale                          |

---

## 📦 Funzionalità Implementate

### ✅ Completate

- **Autenticazione JWT**
  - Registrazione con email/username/password
  - Login con email/telefono/username
  - Logout con invalidazione cookie
  - Password hashate con bcrypt (10 rounds)

- **Sistema Profili**
  - Profili pubblici/privati e badge verifica
  - Bio con parsing @mention e #hashtag
  - Follow con stati pending/accepted/rejected
  - Contatori sincronizzati (followers, following, posts)

- **Feed & Post**
  - API REST complete per like, commenti, salvataggi
  - UI pixel-perfect con carousel media e skeleton
  - Ricerca e explore integrati nel layout principale

- **Stories**
  - Viewer fullscreen con tracking visualizzazioni
  - API pubbliche e private (`/api/stories`, `/api/stories/[id]/public`)
  - Scadenza personalizzata per demo (99 anni) con seed massivo

- **Messaggistica Direct**
  - Chat 1:1, stato lettura e lista conversazioni
  - Seed con cronologia realistica e notifiche
  - API modulari: creazione chat, invio messaggi, listing

- **Notifiche**
  - Eventi follow/like/comment/story view
  - Endpoint dedicati (`/api/notifications`) e UI badge

### 🚧 In Sviluppo

- Integrazione realtime (Socket.io/webhooks)
- Upload media drag&drop con filtri
- Reels a scorrimento verticale completo
- Strumenti moderazione (report, blocco account)

---

## 💻 Setup Locale

### Prerequisiti

- Node.js 20+ e pnpm
- Git

### Installazione

```bash
# 1. Clona il repository
git clone https://github.com/itps-frontdev/instagram-reverse-engineering.git
cd instagram-reverse-engineering

# 2. Installa dipendenze
pnpm install

# 3. Crea file .env.local
cp .env.example .env.local

# 4. Configura JWT_SECRET in .env.local
# JWT_SECRET=your-random-secret-at-least-32-chars

# 5. Inizializza database + seed
pnpm db:reset
pnpm db:seed

# 6. Avvia dev server
pnpm dev
```

Apri [http://localhost:3000](http://localhost:3000)

### Account di Test

Il seeding genera **80 profili casuali** (95% con foto) con password predefinita `password123`.

Per ottenere un elenco aggiornato dopo `pnpm db:seed` puoi interrogare il database SQLite:

```bash
pnpm exec sqlite3 data/instagram.db "SELECT username, email, is_private FROM profiles LIMIT 10;"
```

Consulta [src/db/seeds/data.ts](src/db/seeds/data.ts) per personalizzare nomi, bio e statistiche.

---

## 🗄️ Database

### Gestione Database

```bash
# Reset database (cancella tutto + ricrea schema)
pnpm db:reset

# Popola con dati di test
pnpm db:seed

# Esegui migration (future)
pnpm db:migrate
```

### Schema Principale

- **users** - Autenticazione (email, phone, password_hash, date_of_birth)
- **profiles** - Informazioni sociali (username, bio, followers_count, is_private)
- **follows** - Social graph (status: pending/accepted/rejected)
- **posts** - Contenuto primario (caption, likes_count, comments_count)
- **post_media** - Media carousel (url, type, position)
- **comments** - Commenti (con thread via parent_id)
- **likes** - Like polimorfici (post/comment/story)
- **saved_posts** - Post salvati
- **stories** - Storie 24h
- **chats** - Conversazioni direct
- **notifications** - Notifiche

**Note:** Il file binario `data/instagram.db` è ignorato da Git. Usa `pnpm db:seed` per rigenerarlo localmente.

---

## 📁 Struttura Progetto

```
instagram-reverse-engineering/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (main)/            # Layout autenticato
│   │   │   ├── page.tsx       # Feed homepage
│   │   │   └── profile/[username]/
│   │   ├── api/               # API Routes
│   │   │   ├── auth/          # Login, register, logout, me
│   │   │   ├── feed/          # Feed, like, save, comments
│   │   │   └── profiles/      # Profili, follow status, actions
│   │   ├── login/
│   │   └── register/
│   ├── components/
│   │   ├── feed/              # Post, FeedContainer, Stories
│   │   ├── profile/           # ProfileHeader, Stats, Bio, Grid
│   │   └── Providers.tsx      # Client providers wrapper
│   ├── contexts/
│   │   └── AuthContext.tsx    # React Context per autenticazione
│   ├── db/
│   │   ├── schema.sql         # Schema SQLite completo
│   │   ├── migrate.ts         # Script migrazione
│   │   ├── seed.ts            # Orchestratore seed
│   │   └── seeds/             # Dati e seeders modulari
│   ├── lib/
│   │   ├── auth.ts            # getCurrentUser, getCurrentProfile
│   │   ├── db.ts              # Query helpers (async)
│   │   ├── jwt.ts             # JWT utils
│   │   ├── design-tokens.ts   # Colori/spacing Instagram
│   │   └── types/             # TypeScript interfaces
│   └── styles/
├── data/
│   └── instagram.db           # Database SQLite (gitignored)
├── .env.example               # Template variabili ambiente
└── package.json
```

---

## 🎨 Design System

Tutti i componenti usano i **design tokens esatti di Instagram**:

```typescript
// Colori principali
primary: '#0095F6'      // Blu Instagram
like: '#ED4956'         // Rosso cuore
textPrimary: '#262626'  // Testo principale (light)
textSecondary: '#8E8E8E' // Testo secondario
border: '#DBDBDB'       // Bordi

// Spacing
max-width: 470px        // Larghezza post
spacing: 3px           // Gap tra post
padding: 12-16px       // Padding interno
```

---

## 🔐 Sicurezza

- ✅ Password hashate con **bcrypt** (10 rounds)
- ✅ JWT in **HTTP-only cookies** (no localStorage)
- ✅ **Soft delete** per dati sensibili
- ✅ Protezione routes con middleware (future)
- ✅ Validazione input su tutti gli endpoint

---

## 🤝 Collaborazione

### Workflow Git

```bash
# Crea branch per feature
git checkout -b feature/nome-feature

# Commit con messaggio descrittivo
git add .
git commit -m "feat: descrizione feature"

# Push e apri PR
git push origin feature/nome-feature
```

### Code Style

- **Formatter:** Prettier (auto-format on save)
- **Linter:** ESLint
- **Commit:** Conventional Commits (feat, fix, docs, refactor)

---

## 📄 Licenza

**All Rights Reserved** - Progetto accademico non destinato all'uso commerciale.

---

## 👥 Team

- [itps-frontdev](https://github.com/itps-frontdev)

---

**Made with ❤️ for learning purposes**
