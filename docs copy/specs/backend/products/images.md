# ImageService — Spec Tecnica

**Tipo documento:** Implementation
**Versione:** 1.0
**Data:** 2026-05-06

---

## Scopo

`ImageService` processa le immagini sorgente (locali o remote HTTP) in immagini WebP normalizzate, le cacheà su disco e costruisce gli URL pubblici content-addressed che vengono inviati ai marketplace.

**Non** gestisce il download FTP delle immagini LELLO — quello è un job separato.
→ [indexer.md — Sincronizzazione immagini LELLO](indexer.md#sincronizzazione-immagini-lello)

---

## Componenti

| Classe | Ruolo |
|---|---|
| `ImageService` | Processing, cache, content-addressing, SKU parsing |
| `ImageController` | Endpoint HTTP pubblico per servire le immagini |
| `ImageProperties` | Configurazione binding (`fatellisync.images.*`) |

---

## Endpoint HTTP pubblico

```
GET /images/product/{filename}
```

Endpoint pubblico — **nessuna autenticazione richiesta**.

### Algoritmo di estrazione SKU dal filename

1. Rimuovi query string (da `?` in poi)
2. Se l'estensione è `jpg`, `jpeg`, `png` o `webp`, rimuovila
3. Se il suffisso finale corrisponde a `_{8 hex lowercase}`, rimuovilo

| Filename in input | SKU estratto |
|---|---|
| `10-123` | `10-123` |
| `10-123.webp` | `10-123` |
| `10-123_a1b2c3d4.webp` | `10-123` |
| `10-123_a1b2c3d4` | `10-123` |
| `L12345` | `L12345` |
| `C00456_ff001122.webp?v=2` | `C00456` |

### Fallback underscore → slash

Se nessun prodotto viene trovato con lo SKU estratto e lo SKU contiene `_`, il controller ritenta sostituendo **tutti** gli `_` con `/`.

Motivazione: gli SKU con slash (es. `10/123`) vengono sanitizzati in `_` nell'URL (`10_123`) perché `/` non è valido in un path segment. Il fallback ricostruisce lo SKU originale.

Esempio: filename `10_123` → SKU `10_123` → non trovato → retry con `10/123` → trovato → serve l'immagine.

### Headers di risposta

| Header | Valore |
|---|---|
| `Content-Type` | `image/webp` |
| `Cache-Control` | `public, max-age=604800` (7 giorni) |

### Codici HTTP

| Caso | Codice |
|---|---|
| Immagine processata con successo | `200 OK` |
| SKU non trovato nel DB | `404 Not Found` |
| SKU trovato ma nessun file sorgente disponibile | `404 Not Found` |

---

## Processing pipeline

```
Input: Product (con image_url e data_source)

1. Controlla cache disco → se valida, ritorna bytes dalla cache
2. Risolvi sorgente → carica BufferedImage (locale o HTTP fetch)
   → se null, ritorna Optional.empty()
3. Crea canvas targetSize×targetSize con sfondo backgroundColor
4. Scala l'immagine sorgente preservando aspect ratio
   available = targetSize × 0.90  (5% padding per lato)
   scale = min(available / srcW, available / srcH)
5. Centra l'immagine scalata sul canvas
6. Codifica in WebP con ImageWriteParam.setCompressionQuality(quality)
   → fallback PNG se il WebP writer non è disponibile nel classpath
7. Persisti bytes in cache disco + scrivi sidecar .hash
8. Ritorna bytes

Output: Optional<byte[]>
```

**Rendering hints:** `INTERPOLATION_BICUBIC`, `RENDER_QUALITY`, `ANTIALIAS_ON`.

---

## Risoluzione sorgente per DataSource

| DataSource | Tipo di `image_url` | Strategia di caricamento |
|---|---|---|
| TAXI | Path assoluto locale (da campo `IMAGE` del DBF) | Leggi file dal filesystem |
| LELLO | Path assoluto locale costruito durante l'indexing | Leggi file dal filesystem |
| CARMECCANICA | URL HTTP (da `g:image_link` del feed XML) | HTTP GET con redirect following |
| C_AND_C | Path assoluto locale (trattato come default) | Leggi file dal filesystem |
| MANUAL | Path assoluto locale (trattato come default) | Leggi file dal filesystem |

Se `image_url` è null o blank → `Optional.empty()` immediato, nessun tentativo di caricamento.

### HTTP fetch — dettaglio (CARMECCANICA)

| Parametro | Valore |
|---|---|
| Timeout connessione | 30 000 ms |
| Timeout lettura | 30 000 ms |
| User-Agent | `FatelliSync/1.0` |
| Redirect massimi | 5 hop (301, 302, 303, 307, 308) |
| Redirect oltre 5 | Ritorna null, logga DEBUG |
| HTTP ≥ 300 non-redirect | Ritorna null, logga TRACE con status |
| IOException | Ritorna null, logga DEBUG con messaggio |

I redirect vengono seguiti **manualmente** (non tramite `setInstanceFollowRedirects(true)`) per poter tracciare la catena e applicare il limite.

---

## Cache disco

### Struttura directory

```
{cache-dir}/
├── {sanitized-sku}.webp          ← immagine processata
└── {sanitized-sku}.webp.hash     ← sidecar: MD5 8 char hex
```

**Sanitizzazione SKU per path file:** `/` → `_`, `\` → `_`.

Esempio: SKU `10/123` → file `10_123.webp` + `10_123.webp.hash`.

### Strategia di invalidazione

| Tipo sorgente | Condizione di validità cache |
|---|---|
| Locale (TAXI, LELLO, C_AND_C, MANUAL) | `mtime(cache) > mtime(source file)` |
| Remota (CARMECCANICA) | età cache < `cache-duration-days` (default 7 giorni) |

Se il file cache non esiste → cache miss, processa sempre.

### Sidecar `.hash`

- Contiene gli 8 caratteri hex del MD5 dell'immagine processata (no newline trailing)
- Scritto contestualmente alla scrittura della cache
- Usato da `getContentHash()` per restituire l'hash senza rileggere il file WebP
- Se il sidecar non esiste o la cache non è valida → viene ricalcolato al prossimo processing

---

## Content addressing

### Formato URL pubblico CDN

```
{cdn-base-url}/images/product/{sanitized-sku}_{hash8}.webp
```

Esempio: `https://hub.fatellicaterinasrl.com/images/product/10_123_a1b2c3d4.webp`

| Componente | Valore |
|---|---|
| `{sanitized-sku}` | SKU con `/` e `\` sostituiti da `_` |
| `{hash8}` | Primi 8 caratteri hex lowercase del MD5 dei byte WebP processati |

**Proprietà dell'hash:** cambia solo se il contenuto dell'immagine processata cambia → cache busting automatico per browser e CDN senza invalidazione esplicita.

**Questo URL non viene salvato nel DB** — viene calcolato on-the-fly da `buildContentAddressedImageUrl()` a partire dallo SKU del prodotto. Il campo `image_url` nel modello `Product` è sempre il riferimento alla sorgente (path locale o URL remoto), mai l'URL CDN.

`buildContentAddressedImageUrl()` restituisce `null` se il prodotto non ha immagine disponibile. I chiamanti devono gestire il null prima di inviarlo a un marketplace.

---

## Dipendenze Gradle

```gradle
implementation 'net.coobird:thumbnailator:0.4.20'
implementation 'org.sejda.imageio:webp-imageio:0.1.6'
```

`webp-imageio` registra il writer WebP tramite Java SPI. Se il JAR non è nel classpath, `ImageIO.getImageWritersByFormatName("webp")` restituisce un iterator vuoto senza lanciare eccezioni — per questo è necessario il controllo esplicito + fallback PNG.

---

## Configurazione

```yaml
fatellisync:
  images:
    cdn-base-url: "https://hub.fatellicaterinasrl.com"   # base URL per content-addressed URLs
    cache-dir: "/mnt/images/.cache"                       # directory cache processata
    cache-duration-days: 7                                # TTL cache per sorgenti remote
    processing:
      target-size: 1000           # dimensione canvas quadrato in pixel
      background-color: "FFFFFF"  # hex senza #
      output-format: "webp"       # formato output (webp o png)
      quality: 0.85               # 0.0–1.0, passato a ImageWriteParam.setCompressionQuality
```

> `base-path` è presente in `ImageProperties` ma non viene usato da `ImageService`: il path delle immagini sorgente arriva dal campo `image_url` del prodotto, non da questo parametro. Lasciato per eventuali usi futuri (es. tool di manutenzione).

`application-dev.yaml` (override sviluppo):

```yaml
fatellisync:
  images:
    cdn-base-url: "http://localhost:8080"
    cache-dir: "T:/usr/taxi/gimarc1/pic articles/.cache"
```

---

## Anti-pattern (DO NOT)

| ❌ Non fare | ✅ Fare invece | Perché |
|---|---|---|
| Salvare il content-addressed URL nel campo `image_url` del DB | Calcolarlo on-the-fly con `buildContentAddressedImageUrl()` | L'URL cambia quando cambia l'immagine: se salvato nel DB diventa stale silenziosamente senza che nulla lo invalidi |
| Chiamare `buildContentAddressedImageUrl()` a ogni request HTTP | Chiamarlo una volta per run di sync | Il metodo carica e processa l'immagine: la prima chiamata (cache miss) è costosa — non appartiene al path di un endpoint |
| Passare `product.getImageUrl()` direttamente ai marketplace | Usare `buildContentAddressedImageUrl()` | `image_url` è un path locale o URL sorgente, non un URL pubblico CDN |
| Assumere che l'output sia sempre WebP | Gestire il caso fallback PNG | Se `webp-imageio` non è nel classpath, il Content-Type dichiarato (`image/webp`) diverge dal contenuto effettivo |
| Costruire il path della cache manualmente | Usare il metodo privato `cachePath(sku)` | La sanitizzazione dello SKU (`/` → `_`) è centralizzata lì; farlo altrove produce path inconsistenti |
| Passare `filename` del controller direttamente come SKU a `productRepository` | Usare `ImageService.extractSkuFromFilename(filename)` | I filename content-addressed contengono hash e estensione che vanno rimossi prima del lookup |

---

## Error Handling Matrix

| Caso | Rilevamento | Risposta del servizio | Logging |
|---|---|---|---|
| `image_url` null o blank | Controllo esplicito | `Optional.empty()` | TRACE `no source image for SKU` |
| File sorgente locale non esiste | `Files.exists()` → false | `Optional.empty()` | TRACE `no source image for SKU` |
| File sorgente locale corrotto (`IOException` su `ImageIO.read`) | Exception | `Optional.empty()` | DEBUG con path e messaggio |
| HTTP fetch — status ≥ 300 non-redirect | Status code | `null` → `Optional.empty()` | TRACE con status e URL |
| HTTP fetch — catena redirect > 5 hop | Contatore | `null` → `Optional.empty()` | DEBUG `too many redirects` |
| HTTP fetch — IOException (timeout, reset) | Exception | `null` → `Optional.empty()` | DEBUG con URL e messaggio |
| WebP writer non disponibile nel classpath | `ImageIO.write` → `false` | Fallback PNG, continua | WARN `WebP writer not available, falling back to PNG` |
| Encoding fallisce completamente (`IOException`) | Exception | `Optional.empty()` | ERROR con SKU |
| Cache write fallisce (disco pieno, permessi) | `IOException` | Ignora — ritorna i bytes comunque | WARN con path e messaggio |
| Cache read fallisce (file corrotto) | `IOException` | Processa di nuovo senza usare la cache | WARN con SKU e messaggio |

---

## Riferimenti

| Contenuto | Documento | Sezione |
|---|---|---|
| Campo `image_url` nel modello prodotto | [indexer.md](indexer.md#modello-prodotto) | §Modello prodotto |
| Come LELLO popola `image_url` | [indexer.md](indexer.md#immagini) | §Immagini LELLO |
| Come TAXI popola `image_url` | [indexer.md](indexer.md#sorgente-taxi) | §Mappatura campi DBF |
| Come CARMECCANICA popola `image_url` | [indexer.md](indexer.md#sorgente-carmeccanica) | §Mappatura tag XML |
| Sync immagini FTP LELLO (job separato) | [indexer.md](indexer.md#sincronizzazione-immagini-lello) | §Sincronizzazione immagini LELLO |
| Utilizzo URL content-addressed nella sync marketplace | [sync-engine.md](../marketplace/sync-engine.md) | — |
