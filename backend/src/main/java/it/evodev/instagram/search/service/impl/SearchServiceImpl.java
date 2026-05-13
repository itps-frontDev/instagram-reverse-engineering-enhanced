package it.evodev.instagram.search.service.impl;

import it.evodev.instagram.search.dto.SearchAccountResultDTO;
import it.evodev.instagram.search.dto.SearchDataDTO;
import it.evodev.instagram.search.exception.SearchException;
import it.evodev.instagram.search.exception.SearchUnauthorizedException;
import it.evodev.instagram.search.exception.SearchValidationException;
import it.evodev.instagram.search.model.SearchProfile;
import it.evodev.instagram.search.repository.SearchAccountRow;
import it.evodev.instagram.search.repository.SearchProfileRepository;
import it.evodev.instagram.search.repository.SearchRepository;
import it.evodev.instagram.search.service.SearchService;
import jakarta.persistence.PersistenceException;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SearchServiceImpl implements SearchService {

    private static final Logger logger = LoggerFactory.getLogger(SearchServiceImpl.class);
    private static final int DEFAULT_LIMIT = 20;
    private static final int MAX_LIMIT = 50;

    private final SearchRepository searchRepository;
    private final SearchProfileRepository searchProfileRepository;

    @Override
    public SearchDataDTO searchAccounts(String authSubject, String query, String type, Integer limit) {
        logger.info("Search service started with type: {}, limit: {}", type, limit);

        UUID userId = parseUserId(authSubject);
        SearchProfile currentProfile = searchProfileRepository.findByUserIdAndDeletedAtIsNull(userId)
                .orElseThrow(() -> new SearchUnauthorizedException("Authenticated profile not found"));

        String normalizedQuery = normalizeQuery(query);
        int normalizedLimit = normalizeLimit(limit);

        if (!"account".equalsIgnoreCase(type)) {
            logger.warn("Unsupported search type received: {}", type);
            logger.info("Search service completed with empty results for unsupported type");
            return new SearchDataDTO(List.of());
        }

        List<SearchAccountRow> rows;
        try {
            rows = searchRepository.searchAccounts(normalizedQuery, currentProfile.getId(), normalizedLimit);
        } catch (PersistenceException exception) {
            logger.error("Search query failed. Error: {}", exception.getMessage());
            throw new SearchException("SEARCH_INTERNAL_ERROR", "Search temporarily unavailable", HttpStatus.INTERNAL_SERVER_ERROR);
        }

        List<SearchAccountResultDTO> results = rows.stream()
                .map(this::toDto)
                .toList();

        logger.info("Search service completed with {} results", results.size());
        return new SearchDataDTO(results);
    }

    private UUID parseUserId(String authSubject) {
        try {
            return UUID.fromString(authSubject);
        } catch (IllegalArgumentException exception) {
            logger.warn("Invalid authentication subject format");
            throw new SearchUnauthorizedException("Authentication subject is invalid");
        }
    }

    private static String normalizeQuery(String query) {
        if (query == null || query.trim().isEmpty()) {
            throw new SearchValidationException("Query parameter q is required");
        }
        return query.trim().toLowerCase();
    }

    private static int normalizeLimit(Integer limit) {
        if (limit == null) {
            return DEFAULT_LIMIT;
        }
        if (limit < 1 || limit > MAX_LIMIT) {
            throw new SearchValidationException("Query parameter limit must be between 1 and 50");
        }
        return limit;
    }

    private SearchAccountResultDTO toDto(SearchAccountRow row) {
        return new SearchAccountResultDTO(
                row.userId().toString(),
                row.username(),
                row.fullName(),
                row.profileImageUrl(),
                row.isVerified(),
                row.isPrivate(),
                row.followersCount(),
                row.isFollowing()
        );
    }
}
