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

## Aggiornare il codice dalla VM

```bash
cd ~/instagram-reverse-engineering-enhanced

git pull origin microservices          # scarica le ultime modifiche

# Se hai modificato codice o Dockerfile → ricostruisci
docker compose down
docker compose up --build -d

# Se hai modificato solo il .env → basta riavviare
docker compose down
docker compose up -d
```

---

## Gestire i container

```bash
docker compose ps                      # stato di tutti i container
docker compose up -d                   # avvia tutto
docker compose up --build -d          # avvia tutto e ricostruisce
docker compose down                    # ferma tutto (DB mantenuto)
docker compose down -v                 # ferma tutto + reset DB
docker compose restart core            # riavvia un singolo servizio
docker compose stop core               # ferma un singolo servizio
```

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

> Dopo ogni riavvio della VM i container **non si riavviano automaticamente** — rientra in SSH e riesegui `docker compose up -d`.

---

## Sequenza tipica di aggiornamento

```bash
# 1. Connettiti
ssh -i "C:\percorso\tuo-file.pem" azureuser@instagram-demo.spaincentral.cloudapp.azure.com

# 2. Vai al progetto
cd ~/instagram-reverse-engineering-enhanced

# 3. Scarica le modifiche
git pull origin microservices

# 4. Ricostruisci e riavvia
docker compose up --build -d

# 5. Attendi 2-3 minuti poi controlla
docker compose ps
docker compose logs --tail=20 core
```
