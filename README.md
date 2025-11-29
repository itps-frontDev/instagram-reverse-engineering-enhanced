# 📸 Instagram Reverse Engineering (Progetto Accademico)

[![Team Badge](https://img.shields.io/badge/Team-itps--frontdev-blueviolet)](https://github.com/itps-frontdev)
[![License](https://img.shields.io/badge/License-All%20Rights%20Reserved-red)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Sprint%201%20(Setup)-orange)](/projects)

**Obiettivo:** Progetto universitario di Programmazione Web mirato alla reverse engineering didattica di Instagram per replicarne l'architettura e l'interfaccia.

---

## 🎯 1. Obiettivi e Finalità del Progetto

Il progetto ha lo scopo di applicare concetti fondamentali dello sviluppo Full-Stack attraverso la ricostruzione funzionale di una piattaforma complessa.

* **Fedeltà UI/UX:** Sviluppare un'applicazione che replichi la **fedele rappresentazione** dell'interfaccia utente (UI) e l'esperienza utente (UX) di Instagram, al fine di studiare e riprodurre i suoi standard di design.
* **Obiettivo Didattico:** Comprendere le logiche operative, l'architettura e il flusso di dati di un moderno social network.
* **Ambito Legale:** Il codice è **interamente originale** e non utilizza API o risorse proprietarie di Instagram, garantendo la completa autonomia progettuale e tecnica.

## 🛠️ 2. Stack Tecnologico (Monorepo Next.js)

Il progetto è costruito su uno stack moderno e integrato, con l'obiettivo di massimizzare le prestazioni e l'efficienza nello sviluppo.

| Componente | Tecnologia | Giustificazione |
| :--- | :--- | :--- |
| **Frontend/Backend** | **Next.js (latest)** & **TypeScript** | Framework unificato per rendering ibrido e integrazione *full-stack* (Monorepo). |
| **Styling** | **Tailwind CSS** | Utility-First framework per uno *styling* rapido, *responsive* e consistente. |
| **Database/ORM** | **PostgreSQL** & **Prisma ORM** | **PostgreSQL** è scelto per la sua superiorità nella gestione di **relazioni complesse** (*Follows, Likes*). **Prisma** per la gestione *type-safe* dello schema. |
| **Real-Time** | **Socket.io** | Implementazione di WebSockets per **Messaggistica Diretta** (*Chat*) e aggiornamento istantaneo delle notifiche. |
| **Storage** | **Supabase Storage / Cloudinary** | Servizio Cloud/CDN per l'hosting e l'ottimizzazione di immagini e video, bypassando il server applicativo. |
| **Autenticazione** | **JWT / NextAuth** | Gestione delle sessioni e autenticazione robusta. |

---

## 📦 3. Funzionalità Principali (MVP)

Il progetto si concentra sul completamento delle seguenti *feature* entro la *Roadmap* a Sprint:

* **Autenticazione & Profilo:** Registrazione (Email/Telefono), Login, e Gestione del Profilo Utente.
* **Creazione Post:** Upload Immagini Singole e Salvataggio Metadati.
* **Feed Principale:** Visualizzazione Post degli utenti seguiti con Interazioni (*Like, Commenti*).
* **Ricerca e Follow:** Sistema completo di Follow/Unfollow e Funzionalità di Ricerca Utenti.
* **Messaggistica:** Chat 1-a-1 e Lista Chat in tempo reale (Socket.io).

## 🧠 4. Roadmap e Punti Architetturali Chiave

Il progetto è gestito tramite **Sprint settimanali rigorosi**, focalizzati sulla risoluzione dei seguenti punti architetturali critici (dettagliati nella documentazione):

* **Efficienza del Feed:** Strategie di **Indexing** in PostgreSQL e **Paginazione a Cursore** per ottimizzare le *query* sul *social graph*.
* **Architettura Real-Time:** Integrazione del **Server Socket.io** nel *monorepo* Next.js per la gestione sicura delle *Rooms* di chat.
* **Storage Performance:** Utilizzo del **Flusso di Upload Diretto (Client-to-Cloud)** per delegare la consegna dei file al CDN, garantendo la massima efficienza.

---

## 💻 5. Collaborazione e Setup (Per i Membri del Team)

### A. Primo Setup Locale

1.  **Clona il Repository:**
    `git clone https://github.com/itps-frontdev/instagram-reverse-engineering.git`
2.  **Installa Dipendenze:**
    `npm install` (o `yarn install`)
3.  **Variabili d'Ambiente:** Crea il file `.env` e inserisci le credenziali del DB e le chiavi API.

### B. Strumenti Consigliati

Per garantire la coerenza del codice e la qualità tecnica, il team utilizza:

* **IDE:** VS Code con **ESLint** e **Prettier** (per la formattazione automatica).
* **Database Tools:** **DBeaver** (per l'interazione *raw* con il DB) e **Prisma Studio**.
* **Testing API:** **Postman** o **Thunder Client**.
