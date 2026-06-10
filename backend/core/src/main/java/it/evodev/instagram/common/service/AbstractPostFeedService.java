package it.evodev.instagram.common.service;

import it.evodev.instagram.profile.models.Profile;
import it.evodev.instagram.profile.repository.ProfileJpaRepository;
import it.evodev.instagram.auth.services.AuthSubjectService;
import jakarta.persistence.PersistenceException;
import org.slf4j.Logger;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.function.Supplier;

/**
 * Classe base per i service che gestiscono feed di post (FeedService, ExploreService).
 * Centralizza la logica comune — autenticazione, paginazione, caricamento media —
 * così non viene duplicata in ogni service concreto.
 */
public abstract class AbstractPostFeedService {

    /**
     * Converte il subject JWT (stringa) nell'UUID dell'utente.
     * Delega ad AuthSubjectService e lancia l'eccezione fornita se il subject non è valido.
     */
    protected UUID parseUserId(
            AuthSubjectService authSubjectService,
            String authSubject,
            Supplier<? extends RuntimeException> invalidSubjectExceptionSupplier
    ) {
        return authSubjectService.parseUserId(authSubject, invalidSubjectExceptionSupplier);
    }

    /**
     * Recupera il profilo dell'utente autenticato dal DB.
     * Lancia l'eccezione fornita se il profilo non esiste o è stato eliminato (soft delete).
     */
    protected Profile resolveCurrentProfile(
            ProfileJpaRepository profileRepository,
            UUID userId,
            Supplier<? extends RuntimeException> profileNotFoundExceptionSupplier
    ) {
        return profileRepository.findByUserIdAndDeletedAtIsNull(userId)
                .orElseThrow(profileNotFoundExceptionSupplier);
    }

    /**
     * Esegue una query sul DB proteggendola da PersistenceException.
     *
     * fetcher è una lambda che contiene la query da eseguire — viene chiamata con
     * fetcher.get() e non viene eseguita prima, così il try/catch è scritto una
     * sola volta qui invece di essere ripetuto in ogni service.
     * Se la query fallisce, logga l'errore e lancia l'eccezione fornita da exceptionSupplier.
     */
    protected <T> List<T> fetchWithPersistenceGuard(
            Supplier<List<T>> fetcher,
            Supplier<? extends RuntimeException> exceptionSupplier,
            Logger logger,
            String errorLogMessage
    ) {
        try {
            return fetcher.get();
        } catch (PersistenceException exception) {
            logger.error("{} Error: {}", errorLogMessage, exception.getMessage());
            throw exceptionSupplier.get();
        }
    }

    /**
     * Applica il pattern limit+1 per la paginazione senza query COUNT.
     *
     * Il chiamante richiede al DB limit+1 record. Se ne arrivano più di limit
     * significa che esiste una pagina successiva (hasMore=true) e il record extra
     * viene scartato. nextCursor è l'offset da usare nella chiamata successiva.
     */
    protected <T> PageSlice<T> slicePage(List<T> rawItems, int limit, int offset) {
        boolean hasMore = rawItems.size() > limit;
        List<T> pageItems = hasMore ? rawItems.subList(0, limit) : rawItems;
        String nextCursor = hasMore ? String.valueOf(offset + pageItems.size()) : null;
        return new PageSlice<>(pageItems, nextCursor, hasMore);
    }

    /**
     * Carica i media di una lista di post e li raggruppa in una mappa postId → List<DTO>.
     *
     * Esegue una sola query per tutti i postIds invece di una query per post,
     * evitando il problema N+1. Il risultato è una mappa che permette di recuperare
     * in O(1) tutti i media di un determinato post durante l'assemblaggio dei DTO.
     *
     * I generici <M, D> rendono il metodo riutilizzabile per feed ed explore:
     *   M = tipo della riga grezza dal DB (es. FeedMediaProjection)
     *   D = tipo del DTO finale        (es. FeedMediaDTO)
     *
     * postIdExtractor: funzione che estrae il postId da una riga (es. FeedMediaProjection::getPostId)
     * mediaMapper:     funzione che converte una riga nel DTO corrispondente (es. row -> new FeedMediaDTO(...))
     */
    protected <M, D> Map<Long, List<D>> loadMediaMap(
            List<Long> postIds,
            Supplier<List<M>> mediaRowsFetcher,
            Function<M, Long> postIdExtractor,
            Function<M, D> mediaMapper,
            Supplier<? extends RuntimeException> exceptionSupplier,
            Logger logger,
            String errorLogMessage
    ) {
        if (postIds.isEmpty()) {
            return Map.of();
        }

        List<M> mediaRows = fetchWithPersistenceGuard(
                mediaRowsFetcher,
                exceptionSupplier,
                logger,
                errorLogMessage
        );

        Map<Long, List<D>> mediaByPostId = new HashMap<>();
        for (M row : mediaRows) {
            Long postId = postIdExtractor.apply(row);
            D dto = mediaMapper.apply(row);
            // computeIfAbsent crea la lista per questo postId se non esiste ancora,
            // poi aggiunge il dto — tutto in una sola chiamata.
            mediaByPostId.computeIfAbsent(postId, ignored -> new ArrayList<>()).add(dto);
        }
        return mediaByPostId;
    }

    /**
     * Risultato di una pagina con cursore.
     * items:      i record della pagina corrente (già tagliati a limit)
     * nextCursor: offset da passare nella richiesta successiva, null se non c'è altra pagina
     * hasMore:    true se esistono altri record oltre questa pagina
     */
    protected record PageSlice<T>(List<T> items, String nextCursor, boolean hasMore) {
    }
}
