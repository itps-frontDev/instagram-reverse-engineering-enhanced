package it.evodev.instagram.common.service;

import it.evodev.instagram.auth.models.Profile;
import it.evodev.instagram.auth.repositories.ProfileRepository;
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

public abstract class AbstractPostFeedService {

    protected UUID parseUserId(
            AuthSubjectService authSubjectService,
            String authSubject,
            Supplier<? extends RuntimeException> invalidSubjectExceptionSupplier
    ) {
        return authSubjectService.parseUserId(authSubject, invalidSubjectExceptionSupplier);
    }

    protected Profile resolveCurrentProfile(
            ProfileRepository profileRepository,
            UUID userId,
            Supplier<? extends RuntimeException> profileNotFoundExceptionSupplier
    ) {
        return profileRepository.findByUserIdAndDeletedAtIsNull(userId)
                .orElseThrow(profileNotFoundExceptionSupplier);
    }

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

    protected <T> PageSlice<T> slicePage(List<T> rawItems, int limit, int offset) {
        boolean hasMore = rawItems.size() > limit;
        List<T> pageItems = hasMore ? rawItems.subList(0, limit) : rawItems;
        String nextCursor = hasMore ? String.valueOf(offset + pageItems.size()) : null;
        return new PageSlice<>(pageItems, nextCursor, hasMore);
    }

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
            mediaByPostId.computeIfAbsent(postId, ignored -> new ArrayList<>()).add(dto);
        }
        return mediaByPostId;
    }

    protected record PageSlice<T>(List<T> items, String nextCursor, boolean hasMore) {
    }
}
