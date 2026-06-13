# Guida alla VM Azure

---

## Connessione SSH

```powershell
# Da PowerShell o terminale Windows
ssh -i "C:\percorso\tuo-file.pem" azureuser@instagram-demo.spaincentral.cloudapp.azure.com
```

> Se ricevi errore di permessi sul `.pem`, eseguire una volta sola:
> ```powershell
> icacls "C:\percorso\tuo-file.pem" /inheritance:r
> icacls "C:\percorso\tuo-file.pem" /grant:r "$($env:USERNAME):(R)"
> ```

---

## Navigazione cartelle

```bash
pwd                          # cartella corrente
ls                           # elenca file e cartelle
ls -la                       # tutto, inclusi file nascosti e permessi
cd nome-cartella             # entra nella cartella
cd ..                        # torna su di un livello
cd ~                         # torna alla home
cd ~/instagram-reverse-engineering-enhanced   # vai al progetto
```

---

## Leggere e modificare file

```bash
cat .env                     # mostra contenuto
cat .env | grep API          # filtra le righe con "API"

# Modifica con nano (semplice)
nano .env
# CTRL+O → salva   |   INVIO → conferma   |   CTRL+X → esci

# Modifica con vim
vim .env
# i → inserimento   |   ESC → esci da inserimento
# :wq INVIO → salva ed esci   |   :q! INVIO → esci senza salvare
```

---

## ⚠️ Regola fondamentale sulla VM: usa sempre `-f docker-compose.yml`

Sulla VM si gira in **produzione**: immagini precompilate scaricate dall'ACR.
Un `docker compose up` **senza** `-f` carica in automatico anche
`docker-compose.override.yml`, cioè la modalità **sviluppo** (build da sorgente,
Azurite, hot reload) — che sulla VM è sbagliata. Quindi per ogni comando che
avvia o aggiorna i container, sulla VM passa sempre `-f docker-compose.yml`.

---

## Primo deploy (database vuoto) + seed

Al primissimo avvio il database è vuoto: serve un giro **con il file di seed**,
che popola PostgreSQL (utenti, post, chat) e carica i media su Azure Blob.

**Prerequisiti nel `.env` della VM:**

```env
# Storage media: connection string REALE di Azure (non Azurite)
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...;AccountKey=...
AZURE_STORAGE_CONTAINER_NAME=iree-media
# Demo servita in HTTP puro su dominio reale → cookie non-Secure, altrimenti
# il login riesce ma resta bloccato sulla pagina di login
COOKIE_SECURE=false
```

> REGISTRY e TAG si possono omettere: i default puntano già all'ACR, tag `1.0.0`.

**Sequenza:**

```bash
cd ~/instagram-reverse-engineering-enhanced

# 1. Autenticazione al registry Azure (il token dura ~3 ore)
az acr login --name instagramregistry

# 2. Scarica le immagini dall'ACR
docker compose -f docker-compose.yml pull

# 3. PRIMO avvio CON seed (utenti/post/chat + blob su Azure reale)
docker compose -f docker-compose.yml -f docker-compose.seed.yml up -d

# 4. Attendi il completamento del seed — la riga finale attesa nei log è:
#    [DevBlobSeeder] Done — profiles: 80, post images: ..., stories: ..., reels: ...
docker compose -f docker-compose.yml logs -f core

# 5. Riavvia in configurazione NORMALE (senza riseed)
docker compose -f docker-compose.yml up -d
```

> Il seed è idempotente: i blob già presenti su Azure vengono saltati, e i
> changeset di seed non vengono rieseguiti. Il file `docker-compose.seed.yml`
> attiva il profilo `dev` su `core` **e** `directs-service` (chat demo incluse).

---

## Aggiornare il deploy (nuova versione)

Sulla VM il codice non si compila: si scaricano le immagini già pronte dall'ACR.
Il checkout git serve solo per i file compose / `.env`.

```bash
cd ~/instagram-reverse-engineering-enhanced

# 1. Allinea il repo a origin. Su un checkout di deploy usa reset --hard,
#    NON git pull: evita conflitti di merge (e gestisce eventuali riscritture
#    di history). Il .env è untracked → non viene toccato.
git fetch origin
git reset --hard origin/main

# 2. Aggiorna le immagini
az acr login --name instagramregistry
docker compose -f docker-compose.yml pull

# 3. Riavvia con le nuove immagini (il seed NON va rifatto)
docker compose -f docker-compose.yml up -d
```

> Se hai cambiato solo il `.env` (es. `COOKIE_SECURE`), salta i passi 1-2:
> basta `docker compose -f docker-compose.yml up -d` per ricreare i container
> con i nuovi valori.

---

## Gestire i container

```bash
docker compose ps                                  # stato di tutti i container
docker compose -f docker-compose.yml up -d         # avvia tutto (produzione)
docker compose -f docker-compose.yml pull          # aggiorna le immagini dall'ACR
docker compose -f docker-compose.yml down          # ferma tutto (DB mantenuto)
docker compose -f docker-compose.yml down -v       # ferma tutto + RESET DB (richiede riseed!)
docker compose -f docker-compose.yml restart core  # riavvia un singolo servizio
docker compose -f docker-compose.yml stop core     # ferma un singolo servizio
```

> Sulla VM **non** usare `docker compose up --build`: builderebbe dal sorgente
> in modalità sviluppo. In produzione si scaricano le immagini con `pull`.
> Attenzione a `down -v`: azzera il database → al riavvio serve di nuovo il seed.

---

## Leggere i log

```bash
docker compose logs -f                 # tutti i log in tempo reale
docker compose logs core               # log del servizio core
docker compose logs --tail=50 core     # ultime 50 righe
docker compose logs -f frontend        # log live del frontend
```

---

## Verificare che tutto funzioni

```bash
docker compose ps          # tutti i container devono essere "Up"
```

Nel browser:
- App → `http://instagram-demo.spaincentral.cloudapp.azure.com:3000`
- Eureka dashboard → `http://instagram-demo.spaincentral.cloudapp.azure.com:8761`

---

## Comandi utili

```bash
df -h                      # spazio su disco
free -h                    # RAM disponibile
docker system df           # spazio usato da Docker
docker image prune -f      # pulizia immagini non usate
```

---

## Spegnere / riavviare la VM

Da **Azure Portal → Virtual Machines → Stop/Start**.

> I servizi hanno `restart: unless-stopped`: dopo un riavvio della VM, se il
> demone Docker riparte all'avvio, i container tornano su da soli. Se così non
> fosse, rientra in SSH e riesegui `docker compose -f docker-compose.yml up -d`.

---

## Sequenza tipica di aggiornamento

```bash
# 1. Connettiti
ssh -i "C:\percorso\tuo-file.pem" azureuser@instagram-demo.spaincentral.cloudapp.azure.com

# 2. Vai al progetto
cd ~/instagram-reverse-engineering-enhanced

# 3. Allinea il repo (checkout di deploy: reset, non pull)
git fetch origin && git reset --hard origin/main

# 4. Aggiorna le immagini dall'ACR e riavvia
az acr login --name instagramregistry
docker compose -f docker-compose.yml pull
docker compose -f docker-compose.yml up -d

# 5. Attendi 2-3 minuti poi controlla
docker compose ps
docker compose -f docker-compose.yml logs --tail=20 core
```
