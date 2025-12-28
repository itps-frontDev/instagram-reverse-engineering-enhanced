# 🎨 Instagram UI Checklist - Pixel-Perfect Design

Questo documento elenca TUTTI i componenti e le pagine che devono essere aggiornati per matchare esattamente il design di Instagram.

## ✅ Completato

### Autenticazione
- [x] **Favicon** - Logo Instagram SVG con gradiente
- [x] **Login Page** (`src/app/login/page.tsx`) - Form con design Instagram esatto
- [x] **Register Page** (`src/app/register/page.tsx`) - Form a 2 step con design Instagram esatto

### Layout
- [x] **Sidebar** (`src/components/layout/Sidebar.tsx`) - Larghezza 245px, colori #DBDBDB, #262626, #F2F2F2
- [x] **MobileNav** (`src/components/layout/MobileNav.tsx`) - Bottom navigation con profilo utente
- [x] **Main Layout** (`src/app/(main)/layout.tsx`) - Margini corretti per sidebar

### Feed & Suggerimenti
- [x] **Suggestions** (`src/components/feed/Suggestions.tsx`) - Sidebar con suggerimenti utenti reali
- [x] **Homepage** (`src/app/(main)/page.tsx`) - Usa componente Suggestions

---

## ⏳ Da Fare

### Feed Components

#### 📝 **Post Component** (`src/components/feed/Post.tsx`)
**Stato attuale:** Usa colori Instagram ma design non perfetto
**Modifiche richieste:**
- Header con username e menu a 3 punti
- Immagine con aspect ratio 1:1
- Azioni: Like (cuore), Comment (fumetto), Send (aereo), Save (bookmark)
- Like counter e caption
- "Visualizza tutti i commenti" link
- Timestamp in formato "X ore fa"
- Input commento con placeholder "Aggiungi un commento..."
- Colori: #262626 (testo), #8E8E8E (secondario), #ED4956 (like), #DBDBDB (bordi)

#### 📸 **Stories Component** (`src/components/feed/Stories.tsx`)
**Stato attuale:** Da verificare
**Modifiche richieste:**
- Scroll orizzontale con storie
- Avatar circolari con bordo gradiente per storie non viste
- Avatar grigio per storie viste
- Username sotto avatar
- Icona + per aggiungere storia (prima posizione)
- Dimensioni avatar: 56px
- Gap tra storie: 8px

#### 📦 **FeedContainer Component** (`src/components/feed/FeedContainer.tsx`)
**Stato attuale:** Funzionale ma design da verificare
**Modifiche richieste:**
- Loading skeleton con animazione pulse
- Infinite scroll
- Spacing tra post: 12px
- Max width: 470px (già implementato?)

---

### Profile Components

#### 👤 **ProfileHeader** (`src/components/profile/ProfileHeader.tsx`)
**Modifiche richieste:**
- Layout: Avatar (150px) | Info (flex-1)
- Bottoni: "Modifica profilo" / "Segui" / "Messaggio"
- Username con badge verifica se is_verified
- Stats: Posts, Follower, Seguiti (in linea)
- Menu a 3 punti
- Colori bottoni: #EFEFEF per "Modifica profilo", #0095F6 per "Segui"

#### 📊 **ProfileStats** (`src/components/profile/ProfileStats.tsx`)
**Modifiche richieste:**
- 3 statistiche in linea
- Font semibold per numeri, normal per label
- Hover cursor pointer
- Colore: #262626

#### 📝 **ProfileBio** (`src/components/profile/ProfileBio.tsx`)
**Modifiche richieste:**
- Nome completo in bold
- Bio con parsing di @mentions (blu) e #hashtags (blu)
- Website URL cliccabile
- Line height: 18px
- Font size: 14px

#### 🖼️ **ProfileGrid** (`src/components/profile/ProfileGrid.tsx`)
**Modifiche richieste:**
- Grid a 3 colonne
- Gap: 3px (identico Instagram)
- Aspect ratio 1:1 per ogni post
- Hover overlay con like/comment count
- Icon per carousel se media_count > 1

#### 🔒 **ProfilePrivateLock** (da creare)
**Componente nuovo per profili privati:**
- Icona lucchetto
- Testo "Questo account è privato"
- Bottone "Segui" se non sei follower

---

### Pages

#### 🔍 **Search/Explore Page** (`src/app/(main)/search/page.tsx` o `/explore`)
**Stato attuale:** Da verificare completamente
**Modifiche richieste:**
- Search bar sticky in alto
- Grid di post popolari (3 colonne desktop, 3 mobile)
- Alternanza dimensioni: 1x1, 2x1, 1x2 random
- Hover overlay con like/comment
- No bordi tra immagini
- Infinite scroll

#### 💬 **Direct Messages Page** (`src/app/(main)/direct/page.tsx`)
**Stato attuale:** Da rifare completamente
**Modifiche richieste:**
- Layout a 2 colonne: Lista chat (350px) | Conversazione
- Header con username e info
- Lista chat con avatar, nome, preview messaggio, timestamp
- Area messaggi con scroll inverso
- Input messaggio con emoji picker
- Indicatore "sta scrivendo..."
- Colori: #FAFAFA per messaggi ricevuti, white per inviati

#### 🎬 **Reels Page** (`src/app/(main)/reels/page.tsx`)
**Stato attuale:** Da creare
**Modifiche richieste:**
- Layout verticale full-screen
- Swipe verticale tra reels
- Sidebar con azioni: Like, Comment, Share, Save
- Username + descrizione overlay
- Audio e play/pause

#### 🔔 **Notifications Page** (`src/app/(main)/notifications/page.tsx`)
**Stato attuale:** Da creare
**Modifiche richieste:**
- Lista notifiche con avatar, testo, azione, timestamp
- Sezioni: Oggi, Questa settimana, Questo mese, Prima
- Bottoni azione inline (Segui, Conferma, Elimina)
- Badge non letti

#### ➕ **Create Page** (`src/app/(main)/create/page.tsx`)
**Stato attuale:** Da creare
**Modifiche richieste:**
- Modal o pagina full-screen
- Upload drag & drop
- Preview con crop
- Filtri Instagram
- Caption editor con #hashtags e @mentions
- Località, tag persone
- Opzioni avanzate: Disattiva commenti, nascondi like

---

### Componenti Comuni

#### 🔘 **Button Component** (da creare `src/components/ui/Button.tsx`)
**Varianti:**
- Primary: bg-[#0095F6], hover:#1877F2
- Secondary: bg-[#EFEFEF], hover:#DBDBDB
- Danger: bg-[#ED4956]
- Text: transparent con hover
- Dimensioni: small (28px), medium (32px), large (40px)

#### 📥 **Input Component** (da creare `src/components/ui/Input.tsx`)
**Design:**
- Height: 38px
- Border: #DBDBDB
- Background: #FAFAFA
- Focus border: #A8A8A8
- Placeholder: #8E8E8E
- Border radius: 3px

#### 🎭 **Avatar Component** (da creare `src/components/ui/Avatar.tsx`)
**Varianti:**
- Small: 32px
- Medium: 56px
- Large: 150px
- Con bordo gradiente per storie non viste
- Fallback con iniziale utente

#### 📱 **Modal Component** (da creare `src/components/ui/Modal.tsx`)
**Design:**
- Overlay scuro con opacity 65%
- Contenuto centrato
- Border radius: 12px
- Shadow: 0 4px 12px rgba(0,0,0,0.15)
- Animazione fade-in

---

## 🎨 Design Tokens (già creato)

File: `src/lib/design-tokens.ts`

### Colori Principali
```typescript
primary: '#0095F6'      // Blu Instagram
like: '#ED4956'         // Rosso cuore
textPrimary: '#262626'  // Testo principale
textSecondary: '#8E8E8E' // Testo secondario
border: '#DBDBDB'       // Bordi
bgSecondary: '#FAFAFA'  // Background input
bgTertiary: '#F2F2F2'   // Background hover
```

### Spacing
- Post max-width: 470px
- Sidebar width: 245px
- Gap tra post: 12px
- Gap profile grid: 3px
- Padding: 12-16px

### Typography
- Base font size: 14px
- Logo font: Lobster Two (var(--font-instagram))
- Body font: System font (-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto)

---

## 📋 Priority Order

1. **Alta Priorità (Core Experience)**
   - [ ] Post Component
   - [ ] ProfileHeader Component
   - [ ] ProfileGrid Component
   - [ ] Search/Explore Page

2. **Media Priorità**
   - [ ] Stories Component
   - [ ] Direct Messages Page
   - [ ] Notifications Page
   - [ ] Componenti UI comuni (Button, Input, Avatar, Modal)

3. **Bassa Priorità**
   - [ ] Reels Page
   - [ ] Create Page
   - [ ] ProfilePrivateLock Component

---

## 🔧 Workflow Consigliato

Per ogni componente:
1. Aprire Instagram web reale per riferimento
2. Ispezionare con DevTools per colori/dimensioni esatte
3. Creare/aggiornare componente con design esatto
4. Testare su desktop e mobile
5. Verificare dark mode (se applicabile)
6. Marcare come completato in questa checklist

---

## 📸 Screenshot Reference

Per ogni componente, fare screenshot di:
- Instagram web (desktop)
- Instagram web (mobile)
- Nostro clone (desktop)
- Nostro clone (mobile)

Confrontare pixel-by-pixel per assicurare fedeltà assoluta.
