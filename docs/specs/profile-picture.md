# Profile Picture Spec (Implementation)

**Document type:** Implementation  
**Version:** 1.1 (post adversarial review)  
**Scope:** Refactoring foto profilo — spostamento da `auth` a `profile.picture` (BE) e da `profiles/pfp` a `profile/picture` (FE) + aggiornamento Postman e api_routes.csv

---

## 1. Objective

La logica di upload/delete della foto profilo è attualmente nel package `auth` per un motivo storico (blob-storage spec). Appartiene semanticamente al dominio `profile`. Questo spec:

1. Sposta tutto da `auth` a `profile.picture` nel backend.
2. Cambia l'endpoint da `/api/priv/profiles/me/image` a `/api/priv/profiles/me/picture`.
3. Corregge il bug stream del controller originale: usa `file.getBytes()` + `ByteArrayInputStream` invece di `PushbackInputStream` per garantire che lo stream sia in posizione corretta quando passato all'Azure SDK.
4. Sposta il feature folder dal frontend da `features/profiles/pfp` a `features/profile/picture` aggiornando gli endpoint.
5. Sposta le request Postman da `media/Profiles/` a `Profile/Picture/`.
6. Aggiorna `api_routes.csv`.

### Behavioral differences vs `PrivateProfileController` originale

Questo è un refactoring di ownership (da `auth` a `profile.picture`) con un solo fix funzionale: il delete su sovrascrittura.

| Comportamento | `PrivateProfileController` originale | Questa spec |
|---|---|---|
| Valore salvato in DB | `profiles/{id}/{uuid}.jpg` (blob name grezzo) | Identico — `profiles/{id}/{uuid}.jpg` |
| Valore ritornato in response | `profiles/{id}/{uuid}.jpg` (blob name grezzo) | Identico — `profiles/{id}/{uuid}.jpg` |
| Delete blob su sovrascrittura | Identico — `blobStorageService.delete(existingUrl)` direttamente | Identico |

**Contratto frontend già esistente:** `EditProfileForm.tsx` prepende manualmente `/api/media/` alla response (`setProfileImage('/api/media/' + result.data.profileImageUrl)`). I componenti di rendering usano `getMediaUrl()` in `frontend/src/lib/media.ts`. Il DB salva blob name grezzo — il frontend costruisce l'URL.

### Expected outcome

1. Package `it.evodev.instagram.profile.picture` con `controllers`, `dto`, `exceptions` — ownership separata da `auth`.
2. Endpoint: `PUT /api/priv/profiles/me/picture` e `DELETE /api/priv/profiles/me/picture`.
3. Stream safety: `file.getBytes()` + `ByteArrayInputStream` al posto di `PushbackInputStream`.
4. Feature frontend `features/profile/picture/` con actions + schema aggiornati all'endpoint corretto.
5. Consumer `EditProfileForm.tsx` aggiornato.
6. Quattro file `auth` eliminati.
7. Cartella `features/profiles/pfp/` eliminata (3 file).
8. Postman: 2 request spostate in `Profile/Picture/`, 2 vecchie eliminate da `media/Profiles/`.
9. `api_routes.csv`: 4 righe Next.js aggiornate a MIGRATED, 1 riga Spring aggiunta.

---

## 2. Scope Boundaries

### In scope

1. Refactoring package backend: 4 file da `auth` a `profile.picture` con rinomina.
2. Nuovo `ProfilePictureErrorDTO` (non usa `AuthErrorDTO`).
3. Correzione formato URL salvato in DB (bug fix del controller originale).
4. Cambio `@RequestMapping` e `@PutMapping`/`@DeleteMapping` per il nuovo path.
5. Refactoring feature frontend: 3 file da `profiles/pfp` a `profile/picture`.
6. Aggiornamento import in `EditProfileForm.tsx`.
7. Aggiornamento `features/profile/index.ts` con nuovi export.
8. Spostamento Postman upload/delete da `media/Profiles/` a `Profile/Picture/`.
9. Aggiornamento `api_routes.csv`.

### Out of scope

1. `BlobStorageService` — non cambia.
2. `ProfileRepository` — non cambia (`updateProfileImageUrl` accetta qualsiasi stringa).
3. `SecurityConfig` — il pattern `/api/priv/**` copre già `/api/priv/profiles/me/picture`, nessuna modifica necessaria.
4. `GET /api/media/profiles/{id}/{filename}` — non cambia (rimane in `media`).
5. Postman `Get Profile Image.request.yaml` — non cambia (rimane in `media/Profiles/`).
6. I 41 file frontend che consumano `profileImageUrl` — ricevono il valore da API responses che già usano `/api/media/...` dal seeder; il bug fix nel salvataggio allinea i nuovi upload allo stesso formato, nessun consumer da aggiornare.
7. Rinominare `profileImageUrl` → `profilePictureUrl` — il campo DB è `profile_image_url`, il rename romperebbe tutti i 41 consumer e richiederebbe una migration Liquibase. Il vocabolario misto (`ProfilePictureController` + `profileImageUrl`) è intenzionale: il controller riflette l'ownership del dominio, il field name riflette il contratto DB.
8. Next.js route `/api/profiles/upload-image` e `/api/profiles/remove-image` — già delegate a Spring nella blob spec; solo la descrizione in api_routes.csv viene aggiornata.

---

## 3. Current State

### Backend — file da spostare/eliminare

| File attuale | Azione |
|---|---|
| `auth/controllers/PrivateProfileController.java` | Eliminare dopo creazione nuovo |
| `auth/dto/ProfileImageResponseDTO.java` | Eliminare dopo creazione nuovo |
| `auth/exceptions/ProfileImageValidationException.java` | Eliminare dopo creazione nuovo |
| `auth/exceptions/ProfileImageExceptionHandler.java` | Eliminare dopo creazione nuovo |

### Nota sul controller originale

Il `PrivateProfileController` originale salva correttamente il blob name grezzo in DB e lo ritorna in response — nessun bug nel formato URL. Il seeder è anch'esso consistente. Nessuna migration necessaria.

### Frontend — file da spostare/eliminare

| File attuale | Azione |
|---|---|
| `features/profiles/pfp/actions.ts` | Eliminare dopo creazione nuovo |
| `features/profiles/pfp/schema.ts` | Eliminare dopo creazione nuovo |
| `features/profiles/pfp/index.ts` | Eliminare (export migrati in `features/profile/index.ts`) |

### Consumer frontend da aggiornare

| File | Riga da cambiare |
|---|---|
| `frontend/src/components/settings/EditProfileForm.tsx` | riga 26 — import `uploadPfpAction, deletePfpAction` |

### Postman — file da spostare/eliminare

| File attuale | Azione |
|---|---|
| `postman/collections/media/Profiles/Upload Profile Image.request.yaml` | Eliminare dopo creazione nuovo |
| `postman/collections/media/Profiles/Delete Profile Image.request.yaml` | Eliminare dopo creazione nuovo |

---

## 4. Target Architecture

### Backend — nuovo package

```
backend/src/main/java/it/evodev/instagram/profile/picture/
├── controllers/
│   └── ProfilePictureController.java
├── dto/
│   ├── ProfilePictureResponseDTO.java
│   └── ProfilePictureErrorDTO.java
└── exceptions/
    ├── ProfilePictureException.java
    └── ProfilePictureExceptionHandler.java
```

### Frontend — nuovo feature folder

```
frontend/src/features/profile/picture/
├── actions.ts
└── schema.ts
```

### Postman — nuova cartella (dentro `Profile/` già esistente)

```
postman/collections/Profile/Picture/
├── .resources/
│   └── definition.yaml
├── Upload Profile Picture.request.yaml
└── Delete Profile Picture.request.yaml
```

La cartella `postman/collections/Profile/` esiste già (contiene `Edit Profile/`, `Follow Status/`, `Read Profile/`, `Suggestions/`). `Picture/` si aggiunge allo stesso livello.

---

## 5. Authentication Invariant

**Invariante da rispettare in tutto il package:**

`authentication.getName()` ritorna sempre il `userId` come stringa UUID perché `JwtService.generateAccessToken` usa `.subject(String.valueOf(user.getId()))` dove `user.getId()` è di tipo `UUID`.

Questo è documentato ma non può essere garantito a compile time. Il controller wrappa il parse con try/catch per produrre un errore di dominio invece di un `IllegalArgumentException` non gestito:

```java
private Profile resolveProfile(Authentication authentication) {
    UUID userId;
    try {
        userId = UUID.fromString(authentication.getName());
    } catch (IllegalArgumentException e) {
        throw new ProfilePictureException("PROFILE_NOT_FOUND", "Profile not found.");
    }
    return profileRepository.findByUserIdAndDeletedAtIsNull(userId)
            .orElseThrow(() -> new ProfilePictureException("PROFILE_NOT_FOUND", "Profile not found."));
}
```

---

## 6. Backend Implementation

### 6.1 `ProfilePictureErrorDTO`

```java
package it.evodev.instagram.profile.picture.dto;

import java.time.LocalDateTime;

public record ProfilePictureErrorDTO(String error, String message, LocalDateTime timestamp) {}
```

### 6.2 `ProfilePictureResponseDTO`

```java
package it.evodev.instagram.profile.picture.dto;

public record ProfilePictureResponseDTO(boolean success, String profileImageUrl) {}
```

**Nota naming:** il campo si chiama `profileImageUrl` (non `profilePictureUrl`) perché corrisponde al campo `profile_image_url` nel DB e a tutti i 41 consumer frontend. Rinominare richiederebbe migration Liquibase + aggiornamento di tutti i consumer — fuori scope.

### 6.3 `ProfilePictureException`

```java
package it.evodev.instagram.profile.picture.exceptions;

public class ProfilePictureException extends RuntimeException {

    private final String errorCode;

    public ProfilePictureException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public String getErrorCode() {
        return errorCode;
    }
}
```

### 6.4 `ProfilePictureExceptionHandler`

Il mapping HTTP status usa uno switch expression per evitare catene di comparazioni stringa fragili:

```java
package it.evodev.instagram.profile.picture.exceptions;

import it.evodev.instagram.profile.picture.dto.ProfilePictureErrorDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.time.LocalDateTime;

@RestControllerAdvice(basePackages = "it.evodev.instagram.profile.picture")
public class ProfilePictureExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(ProfilePictureExceptionHandler.class);

    @ExceptionHandler(ProfilePictureException.class)
    public ResponseEntity<ProfilePictureErrorDTO> handleValidation(ProfilePictureException e) {
        logger.warn("Profile picture validation failed [{}]: {}", e.getErrorCode(), e.getMessage());
        HttpStatus status = switch (e.getErrorCode()) {
            case "NO_IMAGE", "PROFILE_NOT_FOUND" -> HttpStatus.NOT_FOUND;
            default -> HttpStatus.BAD_REQUEST;
        };
        return ResponseEntity.status(status)
                .body(new ProfilePictureErrorDTO(e.getErrorCode(), e.getMessage(), LocalDateTime.now()));
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ProfilePictureErrorDTO> handleMaxSize(MaxUploadSizeExceededException e) {
        logger.warn("Upload exceeded multipart max size: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
                .body(new ProfilePictureErrorDTO("FILE_TOO_LARGE", "File exceeds maximum allowed size.", LocalDateTime.now()));
    }
}
```

**Mapping HTTP status:**
| errorCode | HTTP |
|---|---|
| `NO_IMAGE` | 404 |
| `PROFILE_NOT_FOUND` | 404 |
| `MISSING_FILE` | 400 |
| `FILE_TOO_LARGE` (business rule) | 400 |
| `INVALID_MIME_TYPE` | 400 |
| `MaxUploadSizeExceededException` (framework) | 413 |

**Nota sulla biforcazione 400/413 per "file troppo grande":** La business rule rifiuta file > 5 MB con 400. Il framework rifiuta file > 10 MB (limite `spring.servlet.multipart.max-file-size` dalla blob spec) con 413. Questa biforcazione è intenzionale: 400 segnala errore del client entro il limite applicativo, 413 segnala superamento del limite infrastrutturale.

### 6.5 `ProfilePictureController`

**Stream safety:** il controller usa `file.getBytes()` + `ByteArrayInputStream` invece di `PushbackInputStream`. Il file è già in memoria (multipart in-memory per file ≤ 5 MB), zero overhead. Elimina l'ambiguità sul position dello stream con il buffering interno dell'Azure SDK.

**URL format:** il DB salva sempre il blob name grezzo (`profiles/{id}/{uuid}.jpg`). La response ritorna il blob name grezzo. Il frontend costruisce l'URL con `getMediaUrl()` o prepende `/api/media/` direttamente (come già fa `EditProfileForm.tsx`).

```java
package it.evodev.instagram.profile.picture.controllers;

import it.evodev.instagram.profile.picture.dto.ProfilePictureResponseDTO;
import it.evodev.instagram.profile.picture.exceptions.ProfilePictureException;
import it.evodev.instagram.auth.models.Profile;
import it.evodev.instagram.auth.repositories.ProfileRepository;
import it.evodev.instagram.media.service.BlobStorageService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/priv/profiles/me/picture")
@RequiredArgsConstructor
public class ProfilePictureController {

    private static final Logger logger = LoggerFactory.getLogger(ProfilePictureController.class);
    private static final long MAX_FILE_SIZE = 5L * 1024 * 1024;

    private static final Map<String, byte[]> MAGIC_BYTES = Map.of(
            "image/jpeg", new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF},
            "image/png",  new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47},
            "image/gif",  new byte[]{0x47, 0x49, 0x46, 0x38},
            "image/webp", new byte[]{0x52, 0x49, 0x46, 0x46}
    );

    private static final Map<String, String> MIME_TO_EXT = Map.of(
            "image/jpeg", ".jpg",
            "image/png",  ".png",
            "image/gif",  ".gif",
            "image/webp", ".webp"
    );

    private final ProfileRepository profileRepository;
    private final BlobStorageService blobStorageService;

    @PutMapping
    public ResponseEntity<ProfilePictureResponseDTO> uploadPicture(
            @RequestParam(name = "image", required = false) MultipartFile file,
            Authentication authentication) throws IOException {

        Profile profile = resolveProfile(authentication);

        if (file == null || file.isEmpty()) {
            throw new ProfilePictureException("MISSING_FILE", "No file provided.");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new ProfilePictureException("FILE_TOO_LARGE", "File exceeds 5 MB limit.");
        }

        byte[] bytes = file.getBytes();
        String detectedMime = detectMimeType(bytes);
        String ext = MIME_TO_EXT.get(detectedMime);

        String blobName = "profiles/" + profile.getId() + "/" + UUID.randomUUID() + ext;
        String existingUrl = profile.getProfileImageUrl();

        blobStorageService.upload(new ByteArrayInputStream(bytes), bytes.length, detectedMime, blobName);
        profileRepository.updateProfileImageUrl(profile.getId(), blobName);

        if (existingUrl != null) {
            try {
                blobStorageService.delete(existingUrl);
            } catch (Exception e) {
                logger.warn("Failed to delete old blob [profileId={}, blob={}]: {}", profile.getId(), existingUrl, e.getMessage());
            }
        }

        logger.info("Profile picture uploaded [profileId={}, blob={}]", profile.getId(), blobName);
        return ResponseEntity.ok(new ProfilePictureResponseDTO(true, blobName));
    }

    @DeleteMapping
    public ResponseEntity<ProfilePictureResponseDTO> removePicture(Authentication authentication) {
        Profile profile = resolveProfile(authentication);

        String existingUrl = profile.getProfileImageUrl();
        if (existingUrl == null) {
            throw new ProfilePictureException("NO_IMAGE", "No profile picture to remove.");
        }

        profileRepository.updateProfileImageUrl(profile.getId(), null);

        try {
            blobStorageService.delete(existingUrl);
        } catch (Exception e) {
            logger.warn("Failed to delete blob [profileId={}, blob={}]: {}", profile.getId(), existingUrl, e.getMessage());
        }

        logger.info("Profile picture removed [profileId={}]", profile.getId());
        return ResponseEntity.ok(new ProfilePictureResponseDTO(true, null));
    }

    private Profile resolveProfile(Authentication authentication) {
        UUID userId;
        try {
            userId = UUID.fromString(authentication.getName());
        } catch (IllegalArgumentException e) {
            throw new ProfilePictureException("PROFILE_NOT_FOUND", "Profile not found.");
        }
        return profileRepository.findByUserIdAndDeletedAtIsNull(userId)
                .orElseThrow(() -> new ProfilePictureException("PROFILE_NOT_FOUND", "Profile not found."));
    }

    private String detectMimeType(byte[] bytes) {
        for (Map.Entry<String, byte[]> entry : MAGIC_BYTES.entrySet()) {
            byte[] magic = entry.getValue();
            if (bytes.length >= magic.length && startsWith(bytes, magic)) {
                if ("image/webp".equals(entry.getKey())) {
                    if (bytes.length < 12 || bytes[8] != 'W' || bytes[9] != 'E'
                            || bytes[10] != 'B' || bytes[11] != 'P') {
                        continue;
                    }
                }
                return entry.getKey();
            }
        }
        throw new ProfilePictureException("INVALID_MIME_TYPE",
                "Unsupported file type. Allowed: JPEG, PNG, GIF, WebP.");
    }

    private boolean startsWith(byte[] data, byte[] prefix) {
        for (int i = 0; i < prefix.length; i++) {
            if (data[i] != prefix[i]) return false;
        }
        return true;
    }
}
```

**Limitazione magic byte validation (documentata):** il controllo sui magic bytes verifica solo l'header del file (3–12 byte). Un file con header valido e corpo arbitrario supererebbe la validazione. Per una validazione completa userebbe `ImageIO.read()` — fuori scope per questo refactoring, da considerare in un futuro security spec. Il livello attuale (identico al controller originale) è sufficiente per il caso d'uso attuale.

---

## 7. Frontend Implementation

### 7.1 `features/profile/picture/schema.ts`

Identico al vecchio `features/profiles/pfp/schema.ts`:

```ts
import { z } from "zod";

export type PfpActionResult<T> = { success: true; data: T } | { success: false; error: string };

export type PfpUploadData = {
  profileImageUrl: string;
};

export type PfpDeleteData = {
  profileImageUrl: null;
};

export const uploadPfpInputSchema = z.object({
  image: z.instanceof(File),
});
export type UploadPfpInput = z.infer<typeof uploadPfpInputSchema>;
```

### 7.2 `features/profile/picture/actions.ts`

Endpoint aggiornato a `/api/priv/profiles/me/picture`. Import da `@/features/profile/picture/schema`:

```ts
"use server";

import { redirect } from "next/navigation";

import { springFetch } from "@/lib/spring-client";
import { SpringAuthError } from "@/lib/spring-error";
import type { PfpActionResult, PfpUploadData, PfpDeleteData } from "@/features/profile/picture/schema";

function mapPfpError(status: number): string {
  if (status === 400) return "Invalid file. Check format (JPEG, PNG, GIF, WebP) and size (max 5 MB).";
  if (status === 401) return "Session expired, please log in again.";
  if (status === 404) return "No profile image to remove.";
  if (status === 413) return "File exceeds maximum allowed size.";
  return "Profile image service temporarily unavailable.";
}

export async function uploadPfpAction(
  formData: FormData
): Promise<PfpActionResult<PfpUploadData>> {
  let response: Response | null = null;
  try {
    response = await springFetch("/api/priv/profiles/me/picture", {
      method: "PUT",
      body: formData,
    });
  } catch (error) {
    if (error instanceof SpringAuthError) {
      response = null;
    } else {
      return { success: false, error: "Profile image service is unreachable." };
    }
  }

  if (response === null) {
    redirect("/login");
  }

  if (!response.ok) {
    return { success: false, error: mapPfpError(response.status) };
  }

  let payload: Record<string, unknown> | null = null;
  try {
    payload = await response.json();
  } catch {
    return { success: false, error: "Unexpected response from profile image service." };
  }

  return {
    success: true,
    data: { profileImageUrl: String(payload?.profileImageUrl ?? "") },
  };
}

export async function deletePfpAction(): Promise<PfpActionResult<PfpDeleteData>> {
  let response: Response | null = null;
  try {
    response = await springFetch("/api/priv/profiles/me/picture", {
      method: "DELETE",
    });
  } catch (error) {
    if (error instanceof SpringAuthError) {
      response = null;
    } else {
      return { success: false, error: "Profile image service is unreachable." };
    }
  }

  if (response === null) {
    redirect("/login");
  }

  if (!response.ok) {
    return { success: false, error: mapPfpError(response.status) };
  }

  return { success: true, data: { profileImageUrl: null } };
}
```

### 7.3 `features/profile/index.ts` — aggiungere export picture

Aggiungere in fondo al file esistente:

```ts
export * from './picture/schema';
export * from './picture/actions';
```

### 7.4 `EditProfileForm.tsx` — aggiornare import

```ts
// prima
import { uploadPfpAction, deletePfpAction } from '@/features/profiles/pfp/actions';

// dopo
import { uploadPfpAction, deletePfpAction } from '@/features/profile/picture/actions';
```

### 7.5 Audit consumer `profileImageUrl` (non richiedono modifiche)

Il grep su `frontend/src` trova 41 file che usano `profileImageUrl`. Tutti ricevono il valore da API responses — Spring o legacy Next.js — che ritornano sempre il valore come salvato in DB. Poiché:

- Righe seeded: già nel formato `/api/media/...` (DevBlobSeeder)
- Righe uploadate dopo questo fix: formato `/api/media/...` (questa spec)
- Righe uploadate con il vecchio `PrivateProfileController` (formato grezzo `profiles/...`): erano già rotte prima, non peggioriamo

Nessun consumer da aggiornare. L'unica azione di eventuali righe "rotte" legacy sarebbe una migration Liquibase one-shot — fuori scope di questo spec.

---

## 8. Postman Implementation

### 8.1 `postman/collections/Profile/Picture/.resources/definition.yaml`

```yaml
$kind: folder
name: Picture
description: Endpoint per upload e rimozione foto profilo dell'utente autenticato.
```

### 8.2 `postman/collections/Profile/Picture/Upload Profile Picture.request.yaml`

```yaml
$kind: http-request
name: Upload Profile Picture
description: "Carica o sostituisce la foto profilo dell'utente autenticato. Error case: 400 se file > 5MB o MIME non ammesso; 413 se supera il limite multipart del framework; 404 se profilo non trovato; 401 se token mancante."
method: PUT
url: "{{baseUrl}}/api/priv/profiles/me/picture"
headers:
  Authorization: Bearer {{accessToken}}
body:
  type: formdata
  content:
    - type: file
      key: image
      src: []
      disabled: false
order: 1000
```

### 8.3 `postman/collections/Profile/Picture/Delete Profile Picture.request.yaml`

```yaml
$kind: http-request
name: Delete Profile Picture
description: "Rimuove la foto profilo dell'utente autenticato. Error case: 404 se non esiste nessuna immagine o profilo non trovato; 401 se token mancante."
method: DELETE
url: "{{baseUrl}}/api/priv/profiles/me/picture"
headers:
  Authorization: Bearer {{accessToken}}
order: 2000
```

---

## 9. api_routes.csv — modifiche

### Righe da aggiornare

| path | description nuova |
|---|---|
| `/api/profiles/upload-image` | `MIGRATED to Spring: /api/priv/profiles/me/picture - PUT - upload foto profilo` |
| `/api/profiles/remove-image` | `MIGRATED to Spring: /api/priv/profiles/me/picture - DELETE - rimozione foto profilo` |
| `/api/profiles/[username]/upload-image` | `MIGRATED to Spring: /api/priv/profiles/me/picture - PUT - upload foto profilo (owner only)` |
| `/api/profiles/[username]/remove-image` | `MIGRATED to Spring: /api/priv/profiles/me/picture - DELETE - rimozione foto profilo (owner only)` |

### Riga da aggiungere (Spring endpoint)

```
/api/priv/profiles/me/picture,PUT|DELETE,"Carica o rimuove la foto profilo dell'utente autenticato; validazione magic bytes + limite 5 MB; salva /api/media/... in DB",Yes,No,Yes,No
```

---

## 10. Migration Plan (step-by-step)

**Ordine di deploy obbligatorio:** il backend deve essere deployato prima del frontend. Se il frontend deploya per primo, chiama `/api/priv/profiles/me/image` (non più esistente) → upload/delete broken fino al deploy BE. Per ambienti con deploy separati, mantenere temporaneamente entrambi gli endpoint nel backend e rimuovere quello vecchio solo dopo il deploy FE.

**Non è necessario un rollback plan per i file eliminati** perché sono in git — un revert del commit è sufficiente.

1. Creare i 4 file backend in `profile/picture/` (sezioni 6.1–6.5).
2. Verificare compilazione: `./gradlew compileJava`.
3. Eliminare i 4 file da `auth/` (`PrivateProfileController`, `ProfileImageResponseDTO`, `ProfileImageValidationException`, `ProfileImageExceptionHandler`).
4. Verificare compilazione di nuovo.
5. Creare `features/profile/picture/schema.ts` e `actions.ts`.
6. Aggiornare `features/profile/index.ts` con i nuovi export.
7. Aggiornare l'import in `EditProfileForm.tsx`.
8. Eliminare la cartella `features/profiles/pfp/` (3 file).
9. Verificare: `tsc --noEmit` sul frontend.
10. Creare i 3 file Postman in `Profile/Picture/`.
11. Eliminare `media/Profiles/Upload Profile Image.request.yaml` e `media/Profiles/Delete Profile Image.request.yaml`.
12. Aggiornare `api_routes.csv` (4 righe update + 1 insert).
13. Deploy backend.
14. Deploy frontend.
15. Test manuale: `PUT /api/priv/profiles/me/picture` con JPEG valido → 200, `profileImageUrl` inizia con `/api/media/`.
16. Test manuale: verificare che `<img src={profileImageUrl}>` in UI sia renderable (non broken).
17. Test manuale: `DELETE /api/priv/profiles/me/picture` → 200; secondo DELETE → 404 `NO_IMAGE`.
18. Test manuale: upload file > 5 MB → 400 `FILE_TOO_LARGE`.
19. Test manuale: upload file con magic bytes non ammessi → 400 `INVALID_MIME_TYPE`.
20. Test manuale: upload senza campo `image` → 400 `MISSING_FILE`.

---

## 11. Anti-Patterns (DO NOT)

| ❌ Don't | ✅ Do instead | Why |
|---|---|---|
| Salvare `blobName` grezzo in DB | Salvare `"/api/media/" + blobName` | Il valore deve essere direttamente usabile come `<img src>` — è il contratto della blob spec e del seeder |
| Chiamare `blobStorageService.delete(existingUrl)` direttamente | Strip del prefix `/api/media/` prima del delete | existingUrl può contenere sia formato seeded (`/api/media/...`) che format upload — il strip gestisce entrambi |
| Usare `PushbackInputStream` per il detect MIME e poi passarlo all'upload | Usare `file.getBytes()` + `ByteArrayInputStream` | Stream safety garantita; zero ambiguità sul position dello stream con l'Azure SDK |
| Importare `AuthErrorDTO` nel nuovo handler | Usare `ProfilePictureErrorDTO` nel package `profile.picture` | Il package deve avere ownership chiara, non dipendenze da `auth` per le risposte |
| `@RequestParam("image") MultipartFile file` (required=true) | `@RequestParam(name="image", required=false) MultipartFile file` | Con `required=true`, Spring lancia `MissingServletRequestPartException` non gestita dal nostro handler invece di `ProfilePictureException("MISSING_FILE")` |
| Rinominare `profileImageUrl` → `profilePictureUrl` nel DTO | Mantenere `profileImageUrl` | Il campo DB è `profile_image_url`; 41 consumer frontend usano `profileImageUrl`; serve migration Liquibase |
| Deployare frontend prima del backend | Deployare BE → attesa avvio → deployare FE | FE punta al nuovo endpoint `/me/picture`; se BE non è pronto → upload/delete broken |
| Fare il rename file-by-file senza compilare tra BE e FE | Compilare BE (step 2+4) e fare `tsc` FE (step 9) prima di procedere | Catch precoce di import non risolti |

---

## 12. Test Case Specifications

### Unit tests required

| Test ID | Component | Input | Expected Output | Edge Cases |
|---|---|---|---|---|
| TC-PFP-001 | `ProfilePictureController` PUT | JPEG valido ≤ 5 MB, auth valida | `200`, `profileImageUrl` inizia con `/api/media/profiles/` | File esattamente 5 MB → accettato |
| TC-PFP-002 | `ProfilePictureController` PUT | File null (`required=false`, campo assente) | `400 MISSING_FILE` | File presente ma vuoto (0 byte) → `400 MISSING_FILE` |
| TC-PFP-003 | `ProfilePictureController` PUT | File > 5 MB | `400 FILE_TOO_LARGE` | File esattamente 5 MB + 1 byte → `400` |
| TC-PFP-004 | `ProfilePictureController` PUT | File con magic bytes `video/mp4` | `400 INVALID_MIME_TYPE` | `.jpg` extension con PNG magic bytes → accettato come PNG |
| TC-PFP-005 | `ProfilePictureController` DELETE | Profile con `profileImageUrl = "profiles/1/avatar.jpg"` | `200`, `blobStorageService.delete("profiles/1/avatar.jpg")` chiamato direttamente | — |
| TC-PFP-006 | `ProfilePictureController` DELETE | Profile con `profileImageUrl = null` | `404 NO_IMAGE` | — |
| TC-PFP-007 | `ProfilePictureController` PUT sovrascrittura | Profile con `profileImageUrl = "profiles/1/uuid.jpg"` | vecchio blob deleted direttamente; nuovo blob creato; DB aggiornato con nuovo blob name grezzo | Blob delete fallisce → warning loggato con profileId + blob, upload e DB update completati ugualmente |
| TC-PFP-008 | `ProfilePictureExceptionHandler` | `ProfilePictureException("NO_IMAGE", ...)` | `404` con body `ProfilePictureErrorDTO` | `ProfilePictureException("PROFILE_NOT_FOUND", ...)` → `404` |
| TC-PFP-009 | `ProfilePictureExceptionHandler` | `ProfilePictureException("MISSING_FILE", ...)` | `400` con body `ProfilePictureErrorDTO` | `ProfilePictureException("INVALID_MIME_TYPE", ...)` → `400` |
| TC-PFP-010 | `ProfilePictureExceptionHandler` | `MaxUploadSizeExceededException` | `413` con body `ProfilePictureErrorDTO` | — |
| TC-PFP-011 | `resolveProfile` | `authentication.getName()` ritorna stringa non-UUID | `ProfilePictureException("PROFILE_NOT_FOUND")` invece di `IllegalArgumentException` non gestita | — |

### Integration tests required

| Test ID | Flow | Setup | Verification | Teardown |
|---|---|---|---|---|
| IT-PFP-001 | `PUT /api/priv/profiles/me/picture` — upload | Profilo auth + JPEG valido | `200`; `profileImageUrl` in response = `/api/media/profiles/{id}/...`; stesso valore in DB; blob presente in Azurite | Delete blob, reset URL |
| IT-PFP-002 | `PUT` — sovrascrittura | Profile con `profile_image_url = "profiles/{id}/avatar.jpg"` in DB | Vecchio blob eliminato da Azurite; nuovo blob creato; blob name grezzo aggiornato in DB | Delete nuovo blob |
| IT-PFP-003 | `DELETE /api/priv/profiles/me/picture` | Profile con blob esistente (`profile_image_url = "profiles/{id}/uuid.jpg"`) | `200`; `profile_image_url = null` in DB; blob eliminato da Azurite | — |
| IT-PFP-004 | `DELETE` — no image | `profile_image_url = null` | `404 NO_IMAGE` | — |
| IT-PFP-005 | Upload — no JWT | `PUT` senza token | `401` da `SecurityConfig` — mai raggiunge il controller | — |
| IT-PFP-006 | Upload — campo assente | `PUT` senza parte `image` | `400 MISSING_FILE` (non `MissingServletRequestPartException` 400 framework) | — |
| IT-PFP-007 | Upload — WebP valido | File con header RIFF+WEBP | `200`; ext `.webp`; URL in DB e response corretti | Delete blob |

---

## 13. Error Handling Matrix

| Errore | Rilevazione | HTTP | Code | Handler | Log |
|---|---|---|---|---|---|
| Campo `image` assente | `required=false` → `file == null` nel controller | 400 | `MISSING_FILE` | `ProfilePictureExceptionHandler` | `warn` (dentro handler) |
| File vuoto | `file.isEmpty()` | 400 | `MISSING_FILE` | `ProfilePictureExceptionHandler` | `warn` |
| File > 5 MB (business rule) | `file.getSize() > MAX_FILE_SIZE` | 400 | `FILE_TOO_LARGE` | `ProfilePictureExceptionHandler` | `warn` |
| File > 10 MB (framework limit) | Spring `MaxUploadSizeExceededException` | 413 | `FILE_TOO_LARGE` | `ProfilePictureExceptionHandler` | `warn` |
| MIME non ammesso (magic bytes) | `detectMimeType` throws | 400 | `INVALID_MIME_TYPE` | `ProfilePictureExceptionHandler` | `warn` |
| Nessuna foto su DELETE | `existingUrl == null` | 404 | `NO_IMAGE` | `ProfilePictureExceptionHandler` | `warn` |
| Profilo non trovato o UUID parse error | `resolveProfile` throws | 404 | `PROFILE_NOT_FOUND` | `ProfilePictureExceptionHandler` | `warn` |
| Blob delete vecchio fallisce | try/catch nel controller | — (swallowed dopo DB update) | — | Nessun handler | `warn` con profileId + blobName |
| Blob upload fallisce | `BlobStorageService.upload` throws → non catchato → `BlobStorageException` | 500 | — | `MediaExceptionHandler` in `media` package (o Spring default) | `error` |
| JWT assente/invalido | `SecurityConfig` prima del controller | 401 | — | `AuthExceptionHandler` in `auth` | security handler |

---

## 14. References

| Topic | Location | Anchor |
|---|---|---|
| `PrivateProfileController` (file da eliminare) | `backend/src/main/java/it/evodev/instagram/auth/controllers/PrivateProfileController.java` | intero file |
| `ProfileImageResponseDTO` (file da eliminare) | `backend/src/main/java/it/evodev/instagram/auth/dto/ProfileImageResponseDTO.java` | intero file |
| `ProfileImageValidationException` (file da eliminare) | `backend/src/main/java/it/evodev/instagram/auth/exceptions/ProfileImageValidationException.java` | intero file |
| `ProfileImageExceptionHandler` (file da eliminare) | `backend/src/main/java/it/evodev/instagram/auth/exceptions/ProfileImageExceptionHandler.java` | intero file |
| `ProfileRepository` (invariato) | `backend/src/main/java/it/evodev/instagram/auth/repositories/ProfileRepository.java` | `updateProfileImageUrl`, `findByUserIdAndDeletedAtIsNull` |
| `Profile` model (invariato) | `backend/src/main/java/it/evodev/instagram/auth/models/Profile.java` | `profileImageUrl`, `id` |
| `BlobStorageService` (invariato) | `backend/src/main/java/it/evodev/instagram/media/service/BlobStorageService.java` | `upload`, `delete` |
| `JwtService` — autentication invariant | `backend/src/main/java/it/evodev/instagram/auth/services/JwtService.java` | `.subject(String.valueOf(user.getId()))` |
| `JwtAuthenticationFilter` — principal setup | `backend/src/main/java/it/evodev/instagram/auth/filter/JwtAuthenticationFilter.java` | `new UsernamePasswordAuthenticationToken(subject, ...)` |
| `SecurityConfig` (invariato) | `backend/src/main/java/it/evodev/instagram/auth/config/SecurityConfig.java` | `/api/priv/**` pattern |
| Feature pfp FE (file da eliminare) | `frontend/src/features/profiles/pfp/` | `actions.ts`, `schema.ts`, `index.ts` |
| `EditProfileForm.tsx` (da aggiornare) | `frontend/src/components/settings/EditProfileForm.tsx` | riga 26 |
| `features/profile/index.ts` (da aggiornare) | `frontend/src/features/profile/index.ts` | fine file |
| Postman upload (da eliminare) | `postman/collections/media/Profiles/Upload Profile Image.request.yaml` | intero file |
| Postman delete (da eliminare) | `postman/collections/media/Profiles/Delete Profile Image.request.yaml` | intero file |
| Postman gerarchia esistente (reference) | `postman/collections/Profile/` | `Edit Profile/`, `Follow Status/`, `Read Profile/`, `Suggestions/` — `Picture/` si aggiunge allo stesso livello |
| `api_routes.csv` | `reports/api_routes.csv` | righe `upload-image`, `remove-image`, `[username]/upload-image`, `[username]/remove-image` |
| Blob storage spec — formato URL previsto | `docs/specs/blob-storage.md` | Section 9 — `Update profiles.profile_image_url = "/api/media/" + blobName` |
| Blob storage spec — DevBlobSeeder formato | `docs/specs/blob-storage.md` | Section 10 — `"/api/media/" + blobName` nel jdbcTemplate.update |
| `ProfileExceptionHandler` (pattern reference) | `backend/src/main/java/it/evodev/instagram/profile/exception/ProfileExceptionHandler.java` | `@RestControllerAdvice` scope pattern |
