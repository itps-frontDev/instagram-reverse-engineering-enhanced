# Indicizzatore Prodotti

## Scopo

L'indicizzatore è la funzionalità che carica e mantiene aggiornato il catalogo prodotti nel database a partire da sorgenti dati esterne eterogenee. Ogni sorgente può avere un formato e un protocollo di accesso diverso; l'indicizzatore le normalizza in un modello prodotto comune e gestisce in modo uniforme la logica di upsert e disattivazione.

---

## Sorgenti dati

Ogni sorgente è identificata da un ID numerico fisso (stabile nel DB) e da un nome simbolico.

| Nome         | ID | Descrizione                                               |
|--------------|----|-----------------------------------------------------------|
| TAXI         | 1  | ERP legacy aziendale — file DBF esportati via EXPOFATELLI |
| LELLO        | 2  | Fornitore esterno                                         |
| C&C          | 3  | Fornitore esterno                                         |
| CARMECCANICA | 4  | Fornitore esterno                                         |
| MANUAL       | 5  | Inserimento manuale — nessuna importazione automatica     |

---

## Modello prodotto

Un prodotto rappresenta un articolo del catalogo. Ogni record conserva anche la sorgente che lo ha indicizzato.

| Campo             | Tipo           | Obbligatorio | Note                                                                          |
|-------------------|----------------|:------------:|-------------------------------------------------------------------------------|
| `sku`             | stringa (32)   | sì           | Codice articolo. **Univoco a livello di sistema** (non solo per sorgente).    |
| `ean`             | stringa (13)   | no           | Codice EAN-13. Valorizzato solo se di lunghezza esatta 13.                    |
| `name`            | testo          | sì           |                                                                               |
| `description`     | testo          | no           | Scritta alla creazione. Non aggiornata automaticamente (vedi §Campi protetti).|
| `data_source_id`  | intero         | sì           | FK alla tabella `data_sources`.                                               |
| `brand`           | stringa (100)  | no           |                                                                               |
| `category_id`     | intero         | sì           | FK alla tabella `categories`.                                                 |
| `weight`          | decimale(10,3) | no           | In kg. Ignorato se ≤ 0.                                                       |
| `length`          | decimale(10,2) | no           |                                                                               |
| `width`           | decimale(10,2) | no           |                                                                               |
| `height`          | decimale(10,2) | no           |                                                                               |
| `dimension_unit`  | enum           | no           | `CM`, `MM`, `M`                                                               |
| `quantity`        | intero         | sì           | Giacenza. Mai negativa: se la sorgente restituisce un valore negativo va azzerata a 0. |
| `min_quantity`    | intero         | no           | Quantità minima ordinabile (es. confezione).                                  |
| `step_quantity`   | intero         | no           | Multiplo di acquisto. Di norma uguale a `min_quantity`.                       |
| `quantity_unit`   | enum           | no           | `PZ`, `KG`, `MT`, `RT`                                                        |
| `purchasing_price`| decimale(10,5) | no           | Prezzo di acquisto netto IVA.                                                 |
| `vat_rate`        | intero         | sì           | Aliquota IVA in percentuale (es. 22). Default 22.                             |
| `properties`      | JSON           | no           | Dati aggiuntivi specifici per sorgente (es. listini prezzi).                  |
| `image_url`       | stringa (500)  | no           | URL esterno o URI locale. Comportamento per sorgente: vedi §Campi protetti.   |
| `is_active`       | booleano       | sì           | Default `true`. `false` = prodotto disattivato (soft delete).                 |
| `created_at`      | timestamp      | sì           | Valorizzato automaticamente alla creazione.                                   |
| `updated_at`      | timestamp      | sì           | Aggiornato automaticamente ad ogni modifica.                                  |

### Invarianti di identità

- `sku` è l'identificativo logico del prodotto ed è univoco in tutto il sistema.
- `data_source_id` indica la provenienza dell'ultimo allineamento, non fa parte della chiave di unicità.
- A livello DB deve esistere un vincolo `UNIQUE(sku)`.

---

## Strategia di indicizzazione (`IndexingStrategy`)

Ogni sorgente dati implementa l'interfaccia `IndexingStrategy`, che espone:

- `dataSource()` → identifica la sorgente.
- `stream()` → restituisce uno `Stream<Product>` dei prodotti da importare. Lo stream deve essere chiudibile (usato in try-with-resources).

Le implementazioni si registrano come Spring bean: l'indicizzatore le raccoglie tutte automaticamente.

### Regole per le implementazioni

- Lo stream deve contenere solo prodotti **validi**: quelli che non soddisfano i criteri di validità della sorgente vanno scartati prima di essere emessi.
- Ogni prodotto emesso deve avere `data_source_id` valorizzato correttamente.
- In caso di errore irrecuperabile nell'apertura della sorgente, lo stream deve lanciare una `RuntimeException` (l'indicizzatore la cattura e la registra).

---

## Motore di indicizzazione (`ProductIndexer`)

Il `ProductIndexer` consuma lo stream prodotto dalla strategia ed esegue le operazioni sul database.

### Flusso di esecuzione

1. Carica dal DB l'insieme di **tutti gli SKU** (attivi e non) per la sorgente corrente.
2. Consuma lo stream in batch di dimensione configurabile (default 500).
3. Per ogni batch, esegue l'**upsert** di ciascun prodotto (vedi §Logica di upsert).
4. Al termine dello stream, disattiva tutti gli SKU rimasti nel set (quelli non più presenti nella sorgente).
5. Restituisce un `IndexingReport` con i conteggi e la durata.

> Gli SKU di prodotti già disattivati sono inclusi nel set perché, se la sorgente li riemette, il prodotto deve essere **riattivato** automaticamente (`is_active = true`), non duplicato.

### Logica di upsert

Per ogni prodotto ricevuto dalla sorgente:

- Se **non esiste** un prodotto con lo stesso SKU → **crea** un nuovo record con tutti i campi valorizzati.
- Se **esiste già** un prodotto con lo stesso SKU (attivo o disattivato) → **aggiorna** solo i campi dichiarati in `@ManagedBy` per la sorgente corrente (vedi §Campi protetti), aggiorna `data_source_id` alla sorgente corrente e imposta sempre `is_active = true`.
- Rimuove lo SKU dal set in entrambi i casi.
- Se si verifica un'eccezione su un singolo prodotto → lo registra come `failed` nel report e continua con il successivo.

### Disattivazione

Al termine, gli SKU rimasti nel set non erano presenti nello stream della sorgente: vengono impostati a `is_active = false` tramite una query bulk.

### Report

Al termine di ogni esecuzione viene prodotto un `IndexingReport` con:

| Campo         | Descrizione                                     |
|---------------|-------------------------------------------------|
| `dataSource`  | Sorgente indicizzata                            |
| `created`     | Prodotti nuovi inseriti                         |
| `updated`     | Prodotti esistenti aggiornati (o riattivati)    |
| `deactivated` | Prodotti disattivati perché assenti dalla fonte |
| `failed`      | Prodotti scartati per errore                    |
| `duration`    | Durata totale dell'indicizzazione               |

---

## Campi protetti (`@ManagedBy`)

Le sorgenti dati non sono il master assoluto del dato: alcuni campi possono essere modificati manualmente (sul sito, nel gestionale) e l'indicizzatore non deve sovrascriverli.

### Meccanismo

Sul modello `Product` ogni campo aggiornabile è annotato con `@ManagedBy`, che dichiara quali sorgenti possono sovrascriverlo **in fase di aggiornamento**.

```java
@Target(ElementType.FIELD)
@Retention(RetentionPolicy.RUNTIME)
public @interface ManagedBy {
    DataSource[] value();
}
```

**Semantica:**
- **Alla creazione** del prodotto: tutti i campi vengono scritti, indipendentemente dall'annotazione.
- **All'aggiornamento**: solo i campi annotati con `@ManagedBy` contenente la sorgente corrente vengono sovrascritti. I campi non inclusi restano intatti nel DB.

**All'avvio** (`@PostConstruct`), il `ProductIndexer` scansiona i campi di `Product` annotati con `@ManagedBy`, chiama `setAccessible(true)` su ciascuno, e costruisce una `Map<DataSource, List<Field>>` che viene riusata per tutta la vita dell'applicazione.

### Comportamento per campo

| Campo             | Sorgenti che possono aggiornarlo          | Motivazione                                                                 |
|-------------------|-------------------------------------------|-----------------------------------------------------------------------------|
| `name`            | nessuna                                   | Scritto alla creazione; poi gestito manualmente (es. nome riscritto per il sito). |
| `description`     | nessuna                                   | Scritta alla creazione; poi gestita manualmente (es. redazione sul sito).   |
| `brand`           | tutte                                     |                                                                             |
| `category_id`     | tutte                                     |                                                                             |
| `ean`             | tutte                                     |                                                                             |
| `weight`          | tutte                                     |                                                                             |
| `length`          | tutte                                     |                                                                             |
| `width`           | tutte                                     |                                                                             |
| `height`          | tutte                                     |                                                                             |
| `dimension_unit`  | tutte                                     |                                                                             |
| `quantity`        | tutte                                     |                                                                             |
| `min_quantity`    | tutte                                     |                                                                             |
| `step_quantity`   | tutte                                     |                                                                             |
| `quantity_unit`   | tutte                                     |                                                                             |
| `purchasing_price`| tutte                                     |                                                                             |
| `vat_rate`        | tutte                                     |                                                                             |
| `properties`      | tutte                                     |                                                                             |
| `image_url`       | LELLO, C&C, CARMECCANICA (non TAXI)       | Per TAXI: scritta alla creazione, poi non aggiornata — un override manuale persiste. Per le altre sorgenti: aggiornata ad ogni run, il valore della sorgente prevale. |

---

## Sorgente TAXI

TAXI è il gestionale legacy aziendale. I prodotti vengono esportati in file DBF tramite il comando `EXPOFATELLI`.

### File coinvolti

| File                      | Contenuto                           |
|---------------------------|-------------------------------------|
| `artmag.dbf` (anagrafica) | Articoli con prezzi e giacenze      |
| `fornit.dbf` (brand)      | Anagrafica fornitori (brand)        |
| `fornpro.dbf` (EAN)       | Associazione SKU → codice EAN       |

### Processo di generazione

Prima di leggere il DBF, viene eseguito il comando:

```
cmd.exe /c "cd /d T:/usr/taxi && EXPOFATELLI 1"
```

Se il comando fallisce (exit code ≠ 0) o il file risultante non esiste, l'importazione si interrompe con errore.

### Mappatura campi DBF → Prodotto

| Campo DBF    | Campo prodotto                       | Note                                                                  |
|--------------|--------------------------------------|-----------------------------------------------------------------------|
| `CODART`     | `sku`                                |                                                                       |
| `DESART`     | `name`                               |                                                                       |
| `DESART`     | `description`                        | Formato: `<h2>{DESART}</h2>`                                          |
| `CODFOR`     | `brand`                              | Lookup su `fornit.dbf` → campo `RAGSOC`                               |
| `CATMER`     | `category`                           | Mappatura su categoria canonica (vedi sotto)                          |
| `ESTATT`     | `quantity`                           | Se negativo, azzerato a 0                                             |
| `PESLOR`     | `weight`                             | In kg, scala 3 decimali. Ignorato se ≤ 0.                             |
| `IMBCES`     | `min_quantity` / `step_quantity`     | Se > 0, entrambi i campi vengono impostati al suo valore              |
| `UNIMIS`     | `quantity_unit`                      | Vedi mappatura sotto. Valore normalizzato: `.` rimosso, maiuscolo.    |
| `CODIVA`     | `vat_rate`                           | Intero                                                                |
| `IMAGE`      | `image_url`                          | Campo opzionale nel DBF: se assente viene ignorato silenziosamente.   |
| `CODART`     | lookup EAN                           | Lookup su `fornpro.dbf` → `CODPRO`. Usato solo se lunghezza = 13.    |
| `ULTPRZACQ`  | `purchasing_price` (listino ACQUISTO)| Prezzo di acquisto, scala 5 decimali                                  |
| `LIS2`–`LIS9`| `properties.listini`                 | Listini prezzi serializzati in JSON (vedi sotto)                      |

### Listini prezzi

I listini vengono serializzati nel campo `properties` come JSON:

```json
{
  "listini": [
    { "name": "DETTAGLIO",  "price": 12.50000, "iva": 22 },
    { "name": "INDUSTRIA",  "price": 11.20000, "iva": 22 },
    { "name": "INGROSSO",   "price": 10.00000, "iva": 22 },
    { "name": "RISERVATO",  "price":  9.50000, "iva": 22 },
    { "name": "AMAZON",     "price": 12.00000, "iva": 22 },
    { "name": "BBLMMANO",   "price": 11.80000, "iva": 22 },
    { "name": "BRICOBRICO", "price": 11.50000, "iva": 22 }
  ]
}
```

Il listino `ACQUISTO` non compare in `properties`: viene usato solo come `purchasing_price`.

### Mappatura `UNIMIS` → `quantity_unit`

| Valore DBF      | `quantity_unit` |
|-----------------|-----------------|
| `KG`            | `KG`            |
| `MT`            | `MT`            |
| `RT`            | `RT`            |
| qualsiasi altro | `PZ`            |

### Mappatura `CATMER` → categoria canonica

| Codice CATMER             | Categoria                         |
|---------------------------|-----------------------------------|
| `10000`, `10002`, `50000` | `FERRAMENTA`                      |
| `10001`                   | `SISTEMI_DI_FISSAGGIO`            |
| `20000`, `20001`          | `COLORI_E_ACCESSORI`              |
| `20002`                   | `VITERIA_E_BULLONERIA`            |
| `30000`, `40000`          | `UTENSILERIA_MANUALE_ED_ELETTRICA`|
| `30001`, `30002`          | `EDILIZIA`                        |
| `60000`                   | `ANTINFORTUNISTICA`               |
| `70000`                   | `SICUREZZA_E_SERRATURE`           |
| `80000`                   | `LINEA_CASA`                      |
| `80001`                   | `MATERIALE_ELETTRICO`             |
| `90000`                   | `MATERIALE_IDRAULICO`             |
| `90001`                   | `GIARDINAGGIO`                    |
| qualsiasi altro           | `GENERICO`                        |

### Regole di validazione TAXI

- Un prodotto con `purchasing_price = 0` viene scartato (non emesso dallo stream).
- Record duplicati (stesso `CODART`) vengono deduplicati: viene tenuto uno solo.

---

## Sorgente LELLO

LELLO è un fornitore esterno che espone il catalogo tramite FTP. I prodotti vengono scaricati come file TXT pipe-delimited all'interno di uno ZIP.

### File coinvolti

| File                       | Contenuto                                 |
|----------------------------|-------------------------------------------|
| `Anagrafiche.zip`          | Archivio ZIP contenente entrambi i file   |
| `Anagrafica_Articoli.txt`  | Dati anagrafici prodotti (pipe-delimited) |
| `Barcode.txt`              | Associazione SKU → EAN (pipe-delimited)   |

Lo ZIP si trova nella cartella remota `/dati/` sul server FTP.

### Formato file

- **Delimitatore**: pipe `|`
- **Charset**: Windows-1252 (`Cp1252`)
- **Righe**: la prima riga è l'header e viene saltata
- **Numero minimo colonne** (`Anagrafica_Articoli.txt`): 33 — record con meno colonne vengono scartati come `failed`

### Mappatura colonne `Anagrafica_Articoli.txt` → Prodotto

| Indice col | Campo prodotto           | Note                                                                                    |
|:----------:|--------------------------|-----------------------------------------------------------------------------------------|
| 0          | `sku`                    | Prefissato con `L` (es. `L12345`)                                                       |
| 1          | `name`                   | Occorrenze di `RIC.` sostituite con `RICAMBIO `                                         |
| 1 + label/valore | `description`      | Vedi §Costruzione descrizione                                                           |
| 3          | `quantity_unit`          | Mappatura: `KG`→KG, `MT`→MT, `RT`→RT, qualsiasi altro→PZ                               |
| 5          | `brand` (fallback)       | Usato solo se col[12] è vuoto                                                           |
| 7          | disponibilità            | Valore stringa usato per calcolare `quantity` (vedi §Quantità)                          |
| 8          | `min_quantity` / `step_quantity` | Se > 0, entrambi i campi impostati allo stesso valore                          |
| 12         | `brand`                  | Marca principale; se vuoto si usa col[5]                                                |
| 13         | `photoCode`              | Codice immagine usato per costruire `image_url` (vedi §Immagini)                        |
| 14, 15, 16 | etichette descrizione    | Usate nella costruzione HTML della descrizione                                          |
| 19, 20, 21 | valori descrizione       | Usati in coppia con le etichette                                                        |
| 25         | `purchasing_price`       | Decimale scala 5. Prodotto scartato se pari a 0.                                        |
| 27         | `category`               | Mappatura su categoria canonica (vedi §Mappatura categorie)                             |
| 32         | `inEsposizione`          | `1` = prodotto in esposizione; influenza il calcolo di `quantity` (vedi §Quantità)      |

**Campi fissi:**

| Campo      | Valore |
|------------|--------|
| `vat_rate` | `22`   |
| `data_source_id` | LELLO (2) |

### Costruzione descrizione

```
<h2>{name}</h2>
[<p>{col[14]}: {col[19]}</p>]  ← solo se entrambi non vuoti
[<p>{col[15]}: {col[20]}</p>]  ← solo se entrambi non vuoti
[<p>{col[16]}: {col[21]}</p>]  ← solo se entrambi non vuoti
[<p>{col[2]}</p>]              ← solo se col[2] non vuoto
```

### Quantità

Il campo `quantity` non è un numero diretto ma si calcola dal valore testuale della disponibilità (col[7]) e dal flag `inEsposizione` (col[32]):

| `availability` (col[7])  | `inEsposizione` (col[32]) | `quantity` |
|--------------------------|---------------------------|-----------|
| `DISPONIBILE`            | qualsiasi                 | `6000`    |
| `SCARSA`                 | `1`                       | `0`       |
| `SCARSA`                 | `0` o vuoto               | `500`     |
| qualsiasi altro          | qualsiasi                 | `0`       |

### EAN da `Barcode.txt`

- Delimitatore: pipe `|`
- Col 0: SKU grezzo (senza prefisso `L`)
- Col 1: EAN
- Header: saltato
- In caso di SKU duplicato, vince il **primo** EAN incontrato
- EAN accettato solo se di lunghezza esatta 13

### Immagini

Le immagini vengono sincronizzate separatamente dall'FTP (vedi §Sincronizzazione immagini LELLO) e processate da `ImageService` (vedi §ImageService).

Durante l'indexing, se `photoCode` (col[13]) non è vuoto:

1. Costruisce il path locale: `{lello.images.local-dir}/{photoCode}.png`
2. Verifica che il file esista sul filesystem. Se non esiste → `image_url = null` (non si blocca l'indicizzazione).
3. Salva il path assoluto come `image_url` (es. `/mnt/images/lello/12345.png` in prod, `T:/usr/taxi/.../lello/12345.png` in dev).

`image_url` non è un URL pubblico — è un riferimento al file sorgente che `ImageService` usa per processare l'immagine. L'URL pubblico (`https://hub.fatellicaterinasrl.com/images/product/{sku}_{hash8}.webp`) viene costruito da `ImageService` al momento della sincronizzazione marketplace, mai durante l'indexing.

### Mappatura categorie LELLO

| Codice categoria LELLO              | Categoria canonica               |
|-------------------------------------|----------------------------------|
| `0100`, `0200`, `0265`, `0290`, `0410` | `FERRAMENTA`                  |
| `0120`                              | `VITERIA_E_BULLONERIA`           |
| `0220`, `0260`, `0920`              | `LINEA_CASA`                     |
| `0240`                              | `ANTINFORTUNISTICA`              |
| `0270`                              | `MATERIALE_ELETTRICO`            |
| `0280`                              | `MATERIALE_IDRAULICO`            |
| `0300`                              | `SICUREZZA_E_SERRATURE`          |
| `0400`                              | `EDILIZIA`                       |
| `0600`, `0620`, `0660`              | `UTENSILERIA_MANUALE_ED_ELETTRICA`|
| `0640`, `0900`                      | `COLORI_E_ACCESSORI`             |
| `0700`, `0720`                      | `GIARDINAGGIO`                   |
| qualsiasi altro                     | `GENERICO`                       |

### Regole di validazione LELLO

- Prodotto con `purchasing_price = 0` → scartato (non emesso dallo stream).
- Riga con meno di 33 colonne → scartata come `failed`.

---

## Sincronizzazione immagini LELLO

La sincronizzazione immagini è un **job schedulato separato** dall'indicizzazione prodotti. Scarica le immagini dall'FTP di LELLO nella cartella locale del container, che `ImageService` usa come sorgente per il processing.

### Comportamento

- **Cron**: configurabile, default `0 0 3 * * *` (ogni giorno alle 03:00).
- **Sorgente**: directory remota FTP (configurabile, es. `/immagini`).
- **Destinazione**: directory locale sul container (es. `/mnt/images/lello`).
- **Strategia**: sincronizzazione incrementale — scarica solo i file nuovi o modificati; non cancella file orfani locali per default.
- **Thread paralleli**: configurabili (default 4) per velocizzare il download.
- **Errore fatale** (impossibile connettersi all'FTP) → lancia `RuntimeException`, logga a livello ERROR. Non impatta l'indicizzazione prodotti.

### Configurazione

```yaml
fatellisync:
  lello:
    ftp:
      hostname: "<host FTP LELLO>"
      port: 21
      username: "<user>"
      password: "<password>"
    images:
      remote-dir: "/immagini"
      local-dir: "/mnt/images/lello"
      sync-cron: "0 0 3 * * *"
      sync-threads: 4
      delete-orphans: false
```

`application-dev.yaml` (override sviluppo):

```yaml
fatellisync:
  lello:
    images:
      local-dir: "T:/usr/taxi/gimarc1/pic articles/lello"
```

---

## ImageService

Spec completa → [images.md](images.md)

---

## Sorgente CARMECCANICA

CARMECCANICA è un fornitore esterno che espone un feed XML tramite HTTP pubblico. Non richiede autenticazione.

### Endpoint

```
GET https://www.carmeccanica.eu/it/amfeed/main/get/file/carmeccanica/
```

- Timeout connessione: 30 secondi
- Timeout lettura: 30 secondi
- Header inviato: `User-Agent: FatelliSync/1.0`
- Redirect: seguiti automaticamente
- Encoding risposta: UTF-8
- Errore HTTP (status ≥ 300 non-redirect) → `RuntimeException` con status code nel messaggio

### Struttura XML

Gli elementi prodotto sono identificati dal tag `<carmeccanica-item>`. Ogni item contiene sottotag con namespace `g:`.

### Mappatura tag XML → Prodotto

| Tag XML              | Campo prodotto      | Note                                                              |
|----------------------|---------------------|-------------------------------------------------------------------|
| `g:id`               | `sku`               | Prefissato con `C` (es. `C00123`). Se vuoto → scartato.          |
| `g:name`             | `name`              |                                                                   |
| `g:description`      | `description`       | Testo as-is, nessun wrapping HTML aggiunto                        |
| `g:price`            | base calcolo prezzo | Prezzo di listino; `purchasing_price` = prezzo × 0.5 (arrotondato scala 5) |
| `g:qty`              | `quantity`          | Intero. Se negativo → azzerato a 0. Se non parsabile → 0.        |
| `g:peso`             | `weight`            | Decimale con separatore `,` o `.`, scala 3. Se non parsabile → ignorato. |
| `g:EAN`              | `ean`               | Accettato solo se lunghezza = 13. Se vuoto → null.               |
| `g:image_link`       | `image_url`         | URL diretto dal feed. Se vuoto → null.                           |
| `g:price_crm_type`   | filtro              | Deve essere `Listino` (case-insensitive). Altrimenti scartato.   |
| `g:dropshipping`     | filtro              | Deve essere `1`. Altrimenti scartato.                            |

**Campi fissi:**

| Campo             | Valore         |
|-------------------|----------------|
| `brand`           | `CARMECCANICA` |
| `category`        | `FERRAMENTA`   |
| `vat_rate`        | `22`           |
| `quantity_unit`   | `PZ`           |
| `min_quantity`    | `1`            |
| `step_quantity`   | `1`            |
| `data_source_id`  | CARMECCANICA (4) |

### Regole di validazione CARMECCANICA

| Condizione                                    | Esito          |
|-----------------------------------------------|----------------|
| `g:price_crm_type` ≠ "Listino"               | Scartato       |
| `g:dropshipping` ≠ "1"                       | Scartato       |
| `g:id` vuoto                                 | Scartato       |
| `purchasing_price` (dopo sconto 50%) = 0     | Scartato       |

### Configurazione

```yaml
fatellisync:
  carmeccanica:
    url: "https://www.carmeccanica.eu/it/amfeed/main/get/file/carmeccanica/"
    http-timeout-ms: 30000
```

---

## Trigger di esecuzione

### Schedulazione automatica

L'indicizzatore gira su tutte le sorgenti attive secondo un cron configurabile (default: ogni ora a minuto 0).

```yaml
fatellisync:
  indexing:
    cron: "0 0 * * * *"
```

Ogni sorgente viene indicizzata in sequenza. Un errore su una sorgente non blocca le successive.

### Trigger manuale via HTTP

Gli endpoint di trigger sono **asincroni**: restituiscono `202 Accepted` con body `{ "job": "...", "runId": "...", "triggeredAt": "..." }` immediatamente.

| Endpoint | Job name |
|---|---|
| `POST /api/priv/admin/indexing` | `indexing-all` |
| `POST /api/priv/admin/indexing/{dataSource}` | `indexing-{dataSource}` |

- `{dataSource}` è il nome enum della sorgente (es. `TAXI`).
- Risponde con `202 Accepted` con body `{ "job": "...", "runId": "...", "triggeredAt": "..." }` in caso di avvio riuscito.
- Risponde con `400 Bad Request` se la sorgente non esiste o non è abilitata.
- Risponde con `409 Conflict` se è già in corso un'indicizzazione per la stessa sorgente.

Il risultato (equivalente a `IndexingReport`) è disponibile nel campo `result` quando il job raggiunge lo stato `COMPLETED`. Vedi [job-progress.md](job-progress.md) e [job-dashboard-backend.md](job-dashboard-backend.md).

### Concorrenza e lock distribuito (ShedLock)

Per evitare esecuzioni concorrenti dello stesso job su più istanze:

- Lo scheduler usa ShedLock con lock globale (`products-indexing-cron`) per la run automatica.
- Il trigger manuale usa ShedLock con lock per sorgente (`products-indexing-{dataSource}`).
- Se il lock è già acquisito, la run non parte e il trigger manuale restituisce `409 Conflict`.

Parametri consigliati:

- `lockAtMostFor`: leggermente superiore alla durata massima attesa della run.
- `lockAtLeastFor`: piccolo margine per evitare rilanci immediati in caso di clock drift.
- I lock sono persistiti su tabella condivisa (`shedlock`) nello stesso DB applicativo.

### Assunzione sul feed sorgente

Per contratto di integrazione, ogni run riceve un feed completo e consistente della sorgente (non sono previsti feed parziali).

---

## Anti-pattern (DO NOT)

| ❌ Non fare | ✅ Fare invece | Perché |
|---|---|---|
| Emettere prodotti non validi dallo `stream()` della strategy | Validare e scartare prima di `yield` | Il `ProductIndexer` si fida dello stream: un prodotto invalido causa un upsert incompleto o un errore a cascata |
| Aggiornare campi non dichiarati in `@ManagedBy` per la sorgente corrente | Controllare la mappa `managedFields` costruita a startup | Sovrascrivere campi protetti annulla modifiche manuali fatte dall'operatore |
| Eseguire `EXPOFATELLI` dentro il container Docker | Usare `skip-export: true` e delegare al Task Scheduler Windows | Il comando è un eseguibile Windows — non può girare su Linux |
| Bloccare l'intera run schedulata se una sorgente fallisce | Catturare l'eccezione per sorgente e continuare con le successive | Il cron itera su tutte le sorgenti — il fallimento di CARMECCANICA non deve impedire TAXI |
| Deduplicare prodotti tra sorgenti diverse (es. stesso articolo da TAXI e LELLO) | Usare SKU distinti con prefisso per sorgente (es. `L12345` per LELLO, `C00123` per CARMECCANICA) | Lo SKU è la chiave univoca di sistema: due sorgenti con lo stesso SKU causano sovrascrittura reciproca |
| Creare nuovi prodotti fuori dall'indicizzatore (es. endpoint REST diretto) | Usare la sorgente `MANUAL` con `DataSource.MANUAL` | Il flusso di upsert, disattivazione e `@ManagedBy` funziona solo dentro `ProductIndexer` |

---

## Error Handling Matrix

| Caso | Rilevamento | Risposta | Logging |
|---|---|---|---|
| `EXPOFATELLI` fallisce (exit code ≠ 0) | `Process.exitValue()` | Eccezione — indicizzazione TAXI non parte | ERROR con exit code |
| File DBF non trovato al path configurato | `FileNotFoundException` | Eccezione — indicizzazione TAXI non parte | ERROR con path |
| File DBF corrotto o illeggibile | Exception da `DBFReader` | Eccezione — indicizzazione TAXI non parte | ERROR con messaggio |
| Connessione FTP LELLO fallisce | `IOException` da `FTPClient.connect` | Eccezione — indicizzazione LELLO non parte | ERROR con hostname |
| ZIP LELLO non contiene `Anagrafica_Articoli.txt` | Controllo post-estrazione | Eccezione — indicizzazione LELLO non parte | ERROR |
| Feed XML CARMECCANICA — HTTP ≥ 300 | Status code | Eccezione — indicizzazione CARMECCANICA non parte | ERROR con status code |
| Feed XML CARMECCANICA — IOException (timeout, reset) | Exception | Eccezione — indicizzazione CARMECCANICA non parte | ERROR con messaggio |
| Errore su singolo prodotto nello stream | Exception nel `parseProduct` / `parseLine` | Prodotto scartato come `failed`, stream continua | ERROR con SKU + messaggio |
| Lock ShedLock già acquisito (run concorrente) | Lock non concesso | Run non parte (comportamento normale) | — |
| Sorgente restituisce 0 prodotti | Stream vuoto | Tutti gli SKU della sorgente vengono disattivati (comportamento corretto per un catalogo svuotato) | INFO con conteggio disattivati |

---

## Deployment

L'applicazione viene eseguita come container Docker. I file delle sorgenti dati (DBF) risiedono su cartelle Windows della macchina host e vengono esposti al container tramite volumi montati.

### Profili Spring

| Profilo | Contesto                  | Path file        |
|---------|---------------------------|------------------|
| default | Produzione (Docker)       | Path Linux dei volumi montati (es. `/mnt/...`) |
| `dev`   | Sviluppo locale (Windows) | Path Windows diretti (es. `S:/...`, `T:/...`)  |

Il profilo `dev` effettua l'override solo delle configurazioni che differiscono dall'ambiente di produzione: datasource, JPA, Liquibase e i path delle sorgenti dati.

## Configurazione

`application.yaml` (produzione / Docker):

```yaml
fatellisync:
  indexing:
    cron: "0 0 * * * *"
    batch-size: 500
  taxi:
    path:
      anagrafica: "/mnt/taxi/res/artmag.dbf"
      brand: "/mnt/taxi/gimarc1/fornit.dbf"
      ean: "/mnt/taxi/gimarc1/fornpro.dbf"
  lello:
    ftp:
      hostname: "<host FTP LELLO>"
      port: 21
      username: "<user>"
      password: "<password>"
    images:
      remote-dir: "/immagini"
      local-dir: "/mnt/images/lello"
      sync-cron: "0 0 3 * * *"
      sync-threads: 4
      delete-orphans: false
  images:
    base-path: "/mnt/images"
    cdn-base-url: "https://hub.fatellicaterinasrl.com"
    cache-dir: "/mnt/images/.cache"
    cache-duration-days: 7
    processing:
      target-size: 1000
      background-color: "FFFFFF"
      output-format: "webp"
      quality: 0.85
  carmeccanica:
    url: "https://www.carmeccanica.eu/it/amfeed/main/get/file/carmeccanica/"
    http-timeout-ms: 30000
```

`application-dev.yaml` (sviluppo locale — override):

```yaml
fatellisync:
  taxi:
    path:
      anagrafica: "S:/_beeallosync/res/artmag.dbf"
      brand: "T:/usr/taxi/gimarc1/fornit.dbf"
      ean: "T:/usr/taxi/gimarc1/fornpro.dbf"
  lello:
    images:
      local-dir: "T:/usr/taxi/gimarc1/pic articles/lello"
  images:
    base-path: "T:/usr/taxi/gimarc1/pic articles"
    cdn-base-url: "http://localhost:8080"
    cache-dir: "T:/usr/taxi/gimarc1/pic articles/.cache"
```
